import React from "react";
import { Trophy } from "lucide-react";
import { cn } from "../../lib/asr-utils";

export const TokenChip = React.memo(({ token, onClick, theme = "dark" }: { token: { count: number | string; title: string; icon: React.ReactNode }; onClick?: () => void; theme?: "light" | "dark" }) => {
  const countNum = Number(token.count) || 0;
  const maxVisual = Math.floor(countNum);
  const visuals = Array.from({ length: maxVisual });

  return (
    <button
      onClick={Number(token.count) > 0 ? onClick : undefined}
      className={cn(
        "flex flex-row items-center justify-between p-4 px-5 rounded-3xl border transition-all group relative outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 overflow-hidden w-full min-h-[72px] gap-4",
        "theme-focus",
        Number(token.count) > 0 && onClick
          ? theme === "dark" ? "bg-white/5 border-white/10 shadow-md cursor-pointer hover:border-blue-500/50 hover:bg-white/10 active:scale-[0.98]" : "bg-black/5 border-black/10 shadow-sm cursor-pointer hover:border-blue-500/50 hover:bg-black/10 active:scale-[0.98]"
          : Number(token.count) > 0
            ? theme === "dark" ? "bg-white/5 border-white/10 shadow-md cursor-default" : "bg-black/5 border-black/10 shadow-sm cursor-default"
            : theme === "dark" ? "bg-transparent opacity-30 grayscale border-zinc-800 cursor-default" : "bg-transparent opacity-30 grayscale border-slate-200 cursor-default",
      )}
    >
      <div className="flex flex-col items-start min-w-[60px] shrink-0 z-10">
        <span className={cn("text-2xl font-black tabular-nums tracking-tighter leading-none", "theme-text-base")}>
          {token.count}
        </span>
        <span className={cn("text-[9px] font-black uppercase tracking-widest mt-1", "theme-text-faint")}>
          {token.title}
        </span>
      </div>

      <div
        className={cn(
          "flex-1 flex flex-col items-end gap-1 z-10 transition-transform text-2xl justify-center",
          Number(token.count) > 0 && onClick ? "group-hover:scale-[1.02]" : "",
        )}
      >
        {maxVisual === 0 ? (
          <div className="text-2xl opacity-20 drop-shadow-none">
            {token.icon}
          </div>
        ) : (
          Array.from({ length: Math.ceil(maxVisual / 10) }).map((_, rIndex) => (
            <div key={rIndex} className="flex items-center justify-end">
              {visuals.slice(rIndex * 10, rIndex * 10 + 10).map((_, cIndex) => {
                const i = rIndex * 10 + cIndex;
                return (
                  <div
                    key={i}
                    className="text-xl leading-none -ml-1 drop-shadow-md"
                    style={{ zIndex: i }}
                  >
                    {token.icon}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </button>
  );
});

export const TrophyStand = React.memo(({ trophy, onClick, theme }: { trophy: { tier: number; title: string; metric: string | number }; onClick?: () => void; theme: "light" | "dark" }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-4 group cursor-pointer active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-3xl p-2",
      "theme-focus"
    )}
  >
    <div
      className={cn(
        "w-20 h-20 rounded-full border-4 flex items-center justify-center relative transition-all group-hover:scale-110 group-hover:-translate-y-2",
        trophy.tier === 1
          ? "bg-amber-500/20 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] text-amber-500"
          : trophy.tier === 2
            ? "bg-zinc-400/20 border-zinc-400 shadow-[0_0_20px_rgba(161,161,170,0.2)] text-zinc-300"
            : "bg-[#CE8946]/20 border-[#CE8946] shadow-[0_0_20px_rgba(206,137,70,0.2)] text-[#CE8946]",
      )}
    >
      <Trophy size={32} strokeWidth={2.5} />
    </div>
    <div className="flex flex-col items-center text-center max-w-[100px]">
      <span
        className={cn(
          "text-[10px] font-black uppercase tracking-tight line-clamp-1",
          theme === "dark" ? "text-white" : "text-zinc-900",
        )}
      >
        {trophy.title}
      </span>
      <span className={cn(
        "text-[14px] font-black tabular-nums tracking-tighter mt-0.5 transition-colors group-hover:text-blue-500",
        theme === "dark" ? "text-zinc-400" : "text-zinc-500"
      )}>
        {trophy.metric}
      </span>
    </div>
  </button>
));

export const FlatCard = React.memo(({ card, onClick, theme }: { card: { rarity: "rare" | "epic" | "mythic" | string; icon: React.ReactNode; title: string; metricLabel: string; progress: number; nextGoal: number }; onClick?: () => void; theme: "light" | "dark" }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-4 p-5 rounded-[2rem] border transition-all active:scale-[0.98] group text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      "theme-focus",
      theme === "dark"
        ? "bg-white/5 border-white/10 hover:border-blue-500/40"
        : "bg-black/5 border-black/10 hover:border-blue-500/40 shadow-sm",
    )}
  >
    <div
      className={cn(
        "w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-6",
        card.rarity === "mythic"
          ? "bg-amber-500/20 border-amber-500/50 text-amber-500"
          : card.rarity === "epic"
            ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
            : "bg-zinc-500/20 border-zinc-500/50 text-zinc-400",
      )}
    >
      {card.icon}
    </div>
    <div className="flex flex-col min-w-0 flex-1">
      <span
        className={cn(
          "text-[12px] font-black uppercase tracking-tight line-clamp-1 group-hover:text-blue-500 transition-colors",
          theme === "dark" ? "text-white" : "text-zinc-900",
        )}
      >
        {card.title}
      </span>
      <div className="flex items-center justify-between gap-4 mt-0.5">
        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
          {card.metricLabel}
        </span>
        <span className={cn(
          "text-[8px] font-black uppercase tracking-widest transition-colors group-hover:text-blue-500",
          theme === "dark" ? "text-zinc-400" : "text-zinc-500"
        )}>
          {card.progress} / {card.nextGoal}
        </span>
      </div>
      <div
        className={cn(
          "mt-1.5 h-1 rounded-full overflow-hidden",
          theme === "dark" ? "bg-white/5" : "bg-black/10"
        )}
      >
        <div
          className={cn(
            "h-full",
            card.rarity === "mythic"
              ? "bg-amber-500"
              : card.rarity === "epic"
                ? "bg-purple-500"
                : "bg-zinc-500",
          )}
          style={{
            width: `${Math.min(100, (card.progress / card.nextGoal) * 100)}%`,
          }}
        />
      </div>
    </div>
  </button>
));
