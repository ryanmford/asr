/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { motion } from "motion/react";
import { Trophy } from "lucide-react";
import { cn } from "../../lib/asr-utils";
import {
 use3DTilt,
 NoiseOverlay,
 MathOverlay,
 PhysicsOverlay,
 DenseOverlay,
} from "./VisualEffects";

interface CollectibleProps {
  player: any;
  theme?: "light" | "dark";
}

export const InteractiveCard = React.memo(
 ({ card, player }: { card: any } & CollectibleProps) => {
 const { tilt, handleMouseMove, handleMouseLeave } = use3DTilt(15);
 const isMythic = card.rarity === "mythic";
 const isEpic = card.rarity === "epic";

 return (
 <motion.div
 onMouseMove={handleMouseMove}
 onMouseLeave={handleMouseLeave}
 style={{
 transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
 transition: "transform 0.1s ease-out",
 }}
 className={cn(
 "w-full max-w-[320px] aspect-[5/7] rounded-[2.5rem] relative overflow-hidden shadow-2xl border flex flex-col group",
 isMythic
 ? "bg-zinc-950 border-amber-500/50 shadow-amber-500/20"
 : isEpic
 ? "bg-zinc-950 border-purple-500/50 shadow-purple-500/20"
 : "bg-zinc-950 border-blue-500/50 shadow-blue-500/20",
 )}
 >
 {/* Background Effects */}
 <MathOverlay />
 <NoiseOverlay />
 {isMythic && <PhysicsOverlay />}
 {isEpic && <DenseOverlay />}

 {/* Rare Shimmer */}
 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

 {/* Header */}
 <div className="p-6 relative z-10 flex flex-col gap-1">
 <div className="flex items-center justify-between">
 <span
 className={cn(
 "text-[10px] font-black uppercase tracking-[0.3em]",
 isMythic
 ? "text-amber-500"
 : isEpic
 ? "text-purple-400"
 : "text-blue-500",
 )}
 >
 {card.rarity} COLLECTIBLE
 </span>
 <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
 {card.icon}
 </div>
 </div>
 <h3 className="text-2xl font-black uppercase tracking-tight text-white mt-2">
 {card.title}
 </h3>
 </div>

 {/* Figure Area */}
 <div className="flex-1 relative flex items-end justify-center px-6 overflow-hidden">
 <div
 className={cn(
 "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[80px]",
 isMythic
 ? "bg-amber-500/10"
 : isEpic
 ? "bg-purple-500/10"
 : "bg-blue-500/10",
 )}
 />
 <div className="w-full aspect-square flex items-center justify-center relative z-10">
 <div
 className={cn(
 "w-4/5 h-4/5 rounded-3xl border flex items-center justify-center p-8 rotate-3 transition-transform group-hover:rotate-6",
 isMythic
 ? "bg-amber-500/20 border-amber-500/30"
 : isEpic
 ? "bg-purple-500/20 border-purple-500/30"
 : "bg-blue-500/20 border-blue-500/30",
 )}
 >
 <div className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-[2.0]">
 {card.icon}
 </div>
 </div>
 </div>
 </div>

 {/* Stats Area */}
 <div className="p-6 pt-0 relative z-10 flex flex-col gap-4">
 <div className="flex flex-col gap-1 text-center">
 <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
 {card.metricLabel}
 </span>
 <span className="text-3xl font-black tabular-nums tracking-tighter text-white">
 {card.metric}
 </span>
 </div>

 <div className="grid grid-cols-2 gap-3">
 {card.telemetry?.map((t: any, i: number) => (
 <div
 key={i}
 className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col"
 >
 <span className="text-[7px] font-black uppercase tracking-widest text-white/30">
 {t.label}
 </span>
 <span className="text-xs font-black tabular-nums tracking-tighter text-white">
 {t.value}
 </span>
 </div>
 ))}
 </div>

 <div className="mt-2 flex flex-col gap-1.5">
 <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-white/40 px-1">
 <span>PROGRESS</span>
 <span>
 {card.progress} / {card.nextGoal}
 </span>
 </div>
 <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
 <motion.div
 initial={{ width: 0 }}
 animate={{
 width: `${Math.min(100, (card.progress / card.nextGoal) * 100)}%`,
 }}
 className={cn(
 "h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]",
 isMythic
 ? "bg-amber-500"
 : isEpic
 ? "bg-purple-500"
 : "bg-blue-500",
 )}
 />
 </div>
 </div>

 <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
 <span className="text-[8px] font-black uppercase tracking-tighter text-white/30">
 {player.name}
 </span>
 <span className="text-[8px] font-black uppercase tracking-tighter text-white/30 truncate max-w-[100px]">
 {card.date}
 </span>
 </div>
 </div>
 </motion.div>
 );
 },
);

export const InteractiveTrophy = React.memo(
 ({ trophy, player }: { trophy: any } & CollectibleProps) => {
 const { tilt, handleMouseMove, handleMouseLeave } = use3DTilt(10);
 const isGold = trophy.tier === 1;
 const isSilver = trophy.tier === 2;

 return (
 <motion.div
 onMouseMove={handleMouseMove}
 onMouseLeave={handleMouseLeave}
 style={{
 transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
 transition: "transform 0.1s ease-out",
 }}
 className={cn(
 "w-full max-w-[280px] aspect-[4/5] rounded-[3rem] relative shadow-2xl flex flex-col items-center justify-center p-8 group",
 isGold
 ? "bg-zinc-950 border-2 border-amber-500/50"
 : isSilver
 ? "bg-zinc-950 border-2 border-zinc-400/50"
 : "bg-zinc-950 border-2 border-[#CE8946]/50",
 )}
 >
 {/* Environmental Reflections */}
 <PhysicsOverlay />
 <DenseOverlay />
 <NoiseOverlay />

 <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

 <div className="relative z-10 flex flex-col items-center gap-6 mt-4">
 {/* Trophy Icon */}
 <div
 className={cn(
 "relative flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2",
 isGold
 ? "text-amber-500 drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]"
 : isSilver
 ? "text-zinc-300 drop-shadow-[0_0_30px_rgba(212,212,216,0.3)]"
 : "text-[#CE8946] drop-shadow-[0_0_30px_rgba(206,137,70,0.4)]",
 )}
 >
 <Trophy size={96} strokeWidth={1} />
 </div>

 <div className="flex flex-col items-center gap-2 text-center">
 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
 OFFICIAL ASR TROPHY
 </span>
 <h3 className="text-xl font-black uppercase tracking-tight text-white line-clamp-1">
 {trophy.title}
 </h3>
 </div>

 <div className="mt-4 flex flex-col items-center gap-1">
 <span className="text-[24px] font-black tabular-nums tracking-tighter text-white">
 {trophy.metric}
 </span>
 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">
 {trophy.metricLabel}
 </span>
 </div>
 </div>

 {/* Base */}
 <div className="mt-auto w-full relative z-10 h-10 rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-950 border border-white/10 flex items-center justify-center shadow-xl">
 <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
 {player.name}
 </span>
 </div>

 <div className="absolute bottom-6 flex items-center gap-4 text-[7px] font-black uppercase tracking-widest text-white/20">
 <span>{trophy.date}</span>
 <span className="w-1 h-1 bg-white/20 rounded-full" />
 <span>ASR GLOBAL NETWORK</span>
 </div>
 </motion.div>
 );
 },
);

const TokenDisc = ({ 
  item, 
  colorClass, 
  borderColorClass, 
  shadowClass,
  theme
}: { 
  item: any; 
  colorClass: string; 
  borderColorClass: string; 
  shadowClass: string;
  theme?: "light" | "dark";
}) => {
  const isDark = theme !== "light";

  return (
    <>
      {/* Edge */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full border-[12px] border-double",
          isDark ? "shadow-[inset_0_0_20px_rgba(255,255,255,0.2)]" : "shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]",
          borderColorClass
        )} 
      />

      {/* Inner Area */}
      <div className={cn(
        "absolute inset-[12px] rounded-full overflow-hidden flex items-center justify-center border-4",
        isDark ? "bg-zinc-950 border-zinc-800 shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]" : "bg-zinc-100 border-zinc-300 shadow-[inset_0_0_60px_rgba(0,0,0,0.2)]"
      )}>
        <PhysicsOverlay />
        <MathOverlay />
        <DenseOverlay />
        <NoiseOverlay />
        
        {/* Subtle Extra Texture */}
        <div className={cn(
          "absolute inset-0 opacity-100 mix-blend-overlay",
          isDark 
            ? "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_100%)]" 
            : "bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.1)_0%,transparent_100%)]"
        )} />
        <div className={cn(
          "absolute inset-0 opacity-100 mix-blend-overlay",
          isDark
            ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.08)_2px,rgba(255,255,255,0.08)_4px)]"
            : "bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)]"
        )} />

        {/* Faint Apex Speed Run Typographic Overlay */}
        <div className={cn(
          "absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden",
          isDark ? "opacity-30 mix-blend-screen" : "opacity-30 mix-blend-multiply"
        )}>
          <span className={cn("text-[110px] font-black leading-[0.65] tracking-[-0.08em] -rotate-12 -translate-x-4", isDark ? "text-white/30" : "text-black/15")}>APEX</span>
          <span className={cn("text-[110px] font-black leading-[0.65] tracking-[-0.08em] -rotate-12 translate-x-4", isDark ? "text-white/30" : "text-black/15")}>SPEED</span>
          <span className={cn("text-[110px] font-black leading-[0.65] tracking-[-0.08em] -rotate-12 -translate-x-6", isDark ? "text-white/30" : "text-black/15")}>RUN</span>
        </div>

        {/* Tactical vector / math / code elements */}
        <div className={cn(
          "absolute inset-0 pointer-events-none select-none",
          isDark ? "opacity-50 mix-blend-screen" : "opacity-40 mix-blend-multiply"
        )}>
           <svg className="absolute w-full h-full" viewBox="0 0 200 200">
              <path d="M 30 30 L 50 30 M 30 30 L 30 50" stroke={isDark ? "white" : "black"} strokeWidth="1.5" fill="none" opacity="0.4" />
              <path d="M 170 170 L 150 170 M 170 170 L 170 150" stroke={isDark ? "white" : "black"} strokeWidth="1.5" fill="none" opacity="0.4" />
              <path d="M 170 30 L 150 30 M 170 30 L 170 50" stroke={isDark ? "white" : "black"} strokeWidth="1.5" fill="none" opacity="0.2" />
              <path d="M 30 170 L 50 170 M 30 170 L 30 150" stroke={isDark ? "white" : "black"} strokeWidth="1.5" fill="none" opacity="0.2" />
              
              <circle cx="100" cy="100" r="85" stroke={isDark ? "white" : "black"} strokeWidth="0.5" strokeDasharray="1 6" fill="none" opacity="0.4" />
              <circle cx="100" cy="100" r="70" stroke={isDark ? "white" : "black"} strokeWidth="0.25" fill="none" opacity="0.2" />
              
              {/* Crosshairs */}
              <line x1="100" y1="12" x2="100" y2="28" stroke={isDark ? "white" : "black"} strokeWidth="0.75" opacity="0.3" />
              <line x1="100" y1="172" x2="100" y2="188" stroke={isDark ? "white" : "black"} strokeWidth="0.75" opacity="0.3" />
              <line x1="12" y1="100" x2="28" y2="100" stroke={isDark ? "white" : "black"} strokeWidth="0.75" opacity="0.3" />
              <line x1="172" y1="100" x2="188" y2="100" stroke={isDark ? "white" : "black"} strokeWidth="0.75" opacity="0.3" />
           </svg>
        </div>

        {/* Shimmer */}
        <div className={cn(
          "absolute inset-0 transition-transform duration-1000 ease-in-out -translate-x-full group-hover:translate-x-full",
          isDark ? "bg-gradient-to-tr from-transparent via-white/10 to-transparent" : "bg-gradient-to-tr from-transparent via-white/40 to-transparent"
        )} />

        <div className="relative z-10 flex flex-col items-center gap-6 scale-[0.9]">
          <div 
            className={cn(
              "group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300",
              colorClass,
              shadowClass
            )}
            style={{ 
              filter: isDark ? "drop-shadow(0 4px 6px rgba(0,0,0,0.8)) drop-shadow(0 0 20px rgba(0,0,0,0.4))" : "drop-shadow(0 4px 6px rgba(255,255,255,0.8)) drop-shadow(0 0 20px rgba(255,255,255,0.6))"
            }}
          >
            <div className="text-5xl">{item.icon}</div>
          </div>
          <span 
            className={cn(
              "text-5xl font-black tabular-nums tracking-tighter leading-none relative z-10",
              isDark ? "text-white" : "text-zinc-900"
            )}
            style={{
              textShadow: isDark 
                ? "0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6), 0 0 1px rgba(0,0,0,0.9)" 
                : "0 4px 12px rgba(255,255,255,0.9), 0 2px 4px rgba(255,255,255,0.8), 0 0 1px rgba(255,255,255,0.9)"
            }}
          >
            {item.count}
          </span>
        </div>
      </div>

      {/* Micro Text on Rim */}
      <div className="absolute inset-2 text-[4px] font-black uppercase tracking-widest flex items-center justify-center pointer-events-none">
        <div 
          className={cn(
            "h-full w-full rounded-full border opacity-50",
            borderColorClass
          )} 
        />
      </div>
    </>
  );
};

export const InteractiveMedal = React.memo(
  ({ medal, player, theme }: { medal: any } & CollectibleProps) => {
    const { tilt, handleMouseMove, handleMouseLeave } = use3DTilt(20);
    const isGold = medal.id === "gold";
    const isSilver = medal.id === "silver";

    const colorClass = isGold ? "text-amber-500" : isSilver ? "text-zinc-400" : "text-[#CE8946]";
    const borderColorClass = isGold ? "border-amber-500/80" : isSilver ? "border-zinc-400/80" : "border-[#CE8946]/80";
    const shadowClass = isGold ? "drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]" : isSilver ? "drop-shadow-[0_0_15px_rgba(161,161,170,0.6)]" : "drop-shadow-[0_0_15px_rgba(206,137,70,0.6)]";

    return (
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 0.1s ease-out",
        }}
        className="w-full max-w-[260px] aspect-square rounded-full relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-4 group cursor-default mx-auto"
      >
        <TokenDisc item={medal} colorClass={colorClass} borderColorClass={borderColorClass} shadowClass={shadowClass} theme={theme} />
      </motion.div>
    );
  },
);

export const InteractiveToken = React.memo(
  ({ token, player, theme }: { token: any } & CollectibleProps) => {
    const { tilt, handleMouseMove, handleMouseLeave } = use3DTilt(20);
    const isFire = token.title === "FIRE";
    
    // Choose colors based on token type. Fire = orange/red, Coin = blue/cyan
    const colorClass = isFire ? "text-orange-400" : "text-white";
    const borderColorClass = isFire ? "border-orange-400/90" : "border-white/90";
    const shadowClass = isFire ? "drop-shadow-[0_0_15px_rgba(251,146,60,0.6)]" : "drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]";

    return (
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 0.1s ease-out",
        }}
        className="w-full max-w-[260px] aspect-square rounded-full relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-4 group cursor-default mx-auto"
      >
        <TokenDisc item={token} colorClass={colorClass} borderColorClass={borderColorClass} shadowClass={shadowClass} theme={theme} />
      </motion.div>
    );
  },
);
