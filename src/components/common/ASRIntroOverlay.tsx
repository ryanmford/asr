import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/asr-utils";
import { RotatingLogo } from "./RotatingLogo";

import { ASRStandardButton } from "./ASRStandardButton";

interface ASRIntroOverlayProps {
  theme: "light" | "dark";
  onStart: () => void;
}

export const ASRIntroOverlay = React.memo(
  ({ theme, onStart }: ASRIntroOverlayProps) => {
    return (
      <div
        className={cn(
          "fixed inset-0 z-[200] flex flex-col items-center justify-center p-8",
          theme === "dark" ? "bg-black text-white" : "bg-slate-50 text-black",
        )}
      >
        <div className="max-w-md w-full flex flex-col items-center text-center gap-8 animate-in fade-in zoom-in duration-1000">
          <div className="scale-[3.0] mb-4">
            <RotatingLogo />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-tight italic">
              APEX
              <br />
              SPEEDRUN
            </h1>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] opacity-30">
              EST. 2024 • THE OFFICIAL WORLD RANKINGS
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <ASRStandardButton
              onClick={onStart}
              theme={theme}
              className="w-full"
              variant="solid"
            >
              INITIALIZE SYSTEM{" "}
              <ChevronRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </ASRStandardButton>
            <p className="text-[9px] font-bold opacity-20 uppercase">
              TAP TO ENTER THE ARENA
            </p>
          </div>
        </div>
      </div>
    );
  },
);
