import React from "react";
import { cn } from "../../lib/asr-utils";

export interface ASRStandardButtonProps {
  children: React.ReactNode;
  variant?: "solid" | "premium";
  color?: "blue" | "red" | "zinc" | "gold";
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
  theme?: "light" | "dark";
}

export const ASRStandardButton = ({
  children,
  variant = "solid",
  color = "blue",
  href,
  target,
  rel,
  onClick,
  className,
  disabled = false,
  theme = "dark",
}: ASRStandardButtonProps) => {
  const Component = href && !disabled ? "a" : "button";
  const isSolid = variant === "solid";

  const getBaseStyles = () => {
    if (disabled) {
      if (theme === "dark") {
        return "bg-zinc-900 border-zinc-800 text-zinc-500 opacity-50";
      } else {
        return "bg-zinc-100 border-zinc-200 text-zinc-400 opacity-50";
      }
    }

    if (isSolid) {
      if (theme === "dark") {
        switch (color) {
          case "red": return "bg-red-600 hover:bg-red-500 text-white border-red-500";
          case "blue": return "bg-blue-600 hover:bg-blue-500 text-white border-blue-500";
          case "gold": return "bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
          default: return "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700";
        }
      } else {
        switch (color) {
          case "red": return "bg-red-500 hover:bg-red-400 text-white border-red-400";
          case "blue": return "bg-blue-500 hover:bg-blue-400 text-white border-blue-400";
          case "gold": return "bg-amber-500 hover:bg-amber-400 text-amber-950 border-amber-400";
          default: return "bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800";
        }
      }
    } else {
      // Premium / Outline approach
      if (theme === "dark") {
        switch (color) {
          case "red": return "bg-red-950/40 hover:bg-red-900/60 text-red-500 border border-red-500/30";
          case "blue": return "bg-blue-950/40 hover:bg-blue-900/60 text-blue-500 border border-blue-500/30";
          case "gold": return "bg-[#332005]/80 hover:bg-[#402808] text-amber-500 border border-amber-500/30";
          default: return "bg-zinc-900/60 hover:bg-zinc-800/80 text-white border border-white/10";
        }
      } else {
        switch (color) {
          case "red": return "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200";
          case "blue": return "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200";
          case "gold": return "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200";
          default: return "bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 shadow-sm";
        }
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
        "relative flex items-center justify-center gap-2 group",
        "py-3.5 px-6 font-black uppercase tracking-[0.2em] transition-colors",
        "rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        !disabled ? "active:scale-[0.98] cursor-pointer" : "cursor-not-allowed",
        getBaseStyles(),
        className
      )}
    >
      {children}
    </Component>
  );
};
