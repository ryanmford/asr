import React, { useState, useEffect } from "react";
import { User, Users, MapPin, Trophy, Waypoints } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/asr-utils";

interface ASRNavDockProps {
  currentView: string;
  setView: (view: string) => void;
  theme: "light" | "dark";
}

export const ASRNavDock = React.memo(
  ({ currentView, setView, theme }: ASRNavDockProps) => {
    const [isCompact, setIsCompact] = useState(false);

    useEffect(() => {
      let lastScrollY = window.scrollY;
      let ticking = false;

      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const currentScrollY = window.scrollY;
            // Scroll down threshold to shrink
            if (currentScrollY > lastScrollY && currentScrollY > 150) {
              setIsCompact(true);
            } 
            // Scroll up to expand
            else if (currentScrollY < lastScrollY - 10 || currentScrollY < 150) {
              setIsCompact(false);
            }
            lastScrollY = currentScrollY;
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navItems = [
      { id: "players", icon: User, label: "PLAYERS" },
      { id: "teams", icon: Users, label: "TEAM" },
      { id: "courses", icon: MapPin, label: "COURSES" },
      { id: "setters", icon: Waypoints, label: "SETTERS" },
      { id: "wof", icon: Trophy, label: "WOF" },
    ];

    return (
      <div 
        className={cn(
          "fixed left-1/2 -translate-x-1/2 z-[100] px-4 w-full pointer-events-none transition-all duration-500 ease-in-out",
          isCompact ? "max-w-[320px]" : "max-w-[400px]"
        )}
        style={{ bottom: `calc(${isCompact ? '16px' : '24px'} + env(safe-area-inset-bottom, 0px))` }}
      >
        <div className="relative group pointer-events-auto">
          {/* Main Glass Container */}
          <nav
            className={cn(
              "relative flex items-center justify-around rounded-full border shadow-2xl backdrop-blur-[24px] transition-all duration-500 ease-out",
              isCompact ? "px-1 py-0.5" : "p-1",
              theme === "dark"
                ? "bg-zinc-950/40 border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                : "bg-white/40 border-black/5 shadow-[0_20px_40px_rgba(0,0,0,0.1)]",
            )}
          >
            {navItems.map((item) => {
              const isActive =
                currentView === item.id ||
                (item.id === "courses" && currentView === "map");
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  aria-label={`View ${item.label}`}
                  onClick={() => setView(item.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center flex-1 rounded-full transition-all duration-500 group outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 active:scale-[0.98]",
                    isCompact ? "h-11" : "h-12",
                    isActive
                      ? "z-20"
                      : "z-10 hover:text-zinc-600 dark:hover:text-zinc-300",
                  )}
                >
                  <div
                    className={cn(
                      "relative transition-all duration-500 ease-out flex flex-col items-center gap-1",
                      isActive
                        ? "text-blue-500"
                        : "text-zinc-500",
                    )}
                  >
                    <Icon
                      size={isCompact ? 18 : 20}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={cn(
                        "transition-all duration-500",
                        isActive && theme === "dark" ? "glow-blue" : "",
                      )}
                    />

                    {/* Tiny Indicator Dot */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-dot"
                        className="w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] absolute -bottom-2.5"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.5,
                        }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    );
  },
);
