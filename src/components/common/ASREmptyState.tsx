import React from "react";
import { ShieldAlert } from "lucide-react";
import { cn } from "../../lib/asr-utils";

export const ASREmptyState = ({
  theme,
  title,
  message,
}: {
  theme: "light" | "dark";
  title: string;
  message: string;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center rounded-[32px] border relative overflow-hidden",
        theme === "dark"
          ? "bg-zinc-900/40 border-zinc-800"
          : "bg-slate-50 border-slate-200"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-[0.02] pointer-events-none",
          theme === "dark"
            ? "bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:16px_16px]"
            : "bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] [background-size:16px_16px]"
        )}
      />
      <div
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mb-4 relative z-10",
          theme === "dark"
            ? "bg-zinc-800/80 shadow-[0_0_30px_rgba(255,255,255,0.05)] text-zinc-400"
            : "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-slate-400"
        )}
      >
        <ShieldAlert size={28} strokeWidth={1.5} />
      </div>
      <h4
        className={cn(
          "text-base font-black tracking-widest uppercase mb-2 relative z-10",
          theme === "dark" ? "text-zinc-300" : "text-zinc-600"
        )}
      >
        {title}
      </h4>
      <p
        className={cn(
          "text-xs font-medium tracking-wide max-w-[240px] leading-relaxed relative z-10",
          theme === "dark" ? "text-zinc-500" : "text-slate-500"
        )}
      >
        {message}
      </p>
    </div>
  );
};
