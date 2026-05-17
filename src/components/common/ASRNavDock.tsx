import React, { useState, useEffect } from "react";
import { User, Users, MapPin, Trophy, Home } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/asr-utils";
import { useDataStore } from "../../store/useDataStore";

interface ASRNavDockProps {
  currentView: string;
  setView: (view: string) => void;
  theme: "light" | "dark";
}

export const ASRNavDock = React.memo(
  ({ currentView, setView, theme }: ASRNavDockProps) => {
    const [isCompact, setIsCompact] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const triggerRefresh = useDataStore((s) => s.triggerRefresh);

    useEffect(() => {
      const handleFocusIn = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
          setIsKeyboardOpen(true);
        }
      };
      
      const handleFocusOut = () => {
        setIsKeyboardOpen(false);
      };
      
      window.addEventListener('focusin', handleFocusIn);
      window.addEventListener('focusout', handleFocusOut);
      
      return () => {
        window.removeEventListener('focusin', handleFocusIn);
        window.removeEventListener('focusout', handleFocusOut);
      }
    }, []);

    useEffect(() => {
      let lastScrollY = window.scrollY;
      let ticking = false;

      const performScrollCheck = (currentScrollY: number) => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
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

      const handleScroll = () => performScrollCheck(window.scrollY);
      const handleCustomScroll = (e: Event) => {
        const ce = e as CustomEvent<{ scrollTop: number }>;
        if (ce.detail && typeof ce.detail.scrollTop === 'number') {
           performScrollCheck(ce.detail.scrollTop);
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("asr-scroll", handleCustomScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("asr-scroll", handleCustomScroll);
      };
    }, []);

    const navItems = [
      { id: "home", icon: Home, label: "HOME" },
      { id: "courses", icon: MapPin, label: "COURSES" },
      { id: "players", icon: User, label: "PLAYERS" },
      { id: "teams", icon: Users, label: "TEAM" },
      { id: "hof", icon: Trophy, label: "HOF" },
    ];

    return (
      <div 
        className={cn(
          "fixed left-1/2 -translate-x-1/2 z-[100] px-4 w-full pointer-events-none transition-all duration-500 ease-out flex justify-center items-center",
          isCompact ? "max-w-[320px]" : "max-w-[400px]",
          isKeyboardOpen ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        )}
        style={{ 
          bottom: `calc(24px + env(safe-area-inset-bottom, 0px))`,
          height: '64px'
        }}
      >
        <div className="relative group pointer-events-auto w-full">
          {/* Main Glass Container */}
          <nav
            className={cn(
              "relative flex items-center justify-around rounded-full border backdrop-blur-2xl transition-all duration-500 ease-out",
              isCompact ? "px-1.5 py-1" : "p-1.5",
              theme === "dark"
                ? "bg-zinc-900/60 border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                : "bg-white/70 border-black/[0.04] shadow-[0_20px_40px_rgba(0,0,0,0.12)]",
            )}
          >
            {navItems.map((item) => {
              const isActive =
                currentView === item.id ||
                (item.id === "courses" && currentView === "map");
              const Icon = item.icon;

              return (
                <motion.button
                  key={item.id}
                  aria-label={`View ${item.label}`}
                  onClick={() => {
                    if (isActive) {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      triggerRefresh();
                    } else {
                      setView(item.id);
                    }
                  }}
                  whileTap={{ scale: 0.82 }}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className={cn(
                    "relative flex flex-col items-center justify-center flex-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 cursor-pointer overflow-visible",
                    isCompact ? "h-11" : "h-12",
                    isActive ? "z-20" : "z-10"
                  )}
                >
                  {/* Subtle active background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className={cn(
                        "absolute inset-0 rounded-full",
                        theme === "dark"
                          ? "bg-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                          : "bg-black/[0.04] shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)]"
                      )}
                      transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
                    />
                  )}

                  <div className="relative flex flex-col items-center justify-center z-10 w-full h-full pointer-events-none">
                    <motion.div
                      initial={false}
                      animate={{
                        y: isActive ? -1.5 : 0,
                        color: isActive
                          ? "#3b82f6" // text-blue-500
                          : theme === "dark" ? "#a1a1aa" : "#71717a", // text-zinc-400 / text-zinc-500
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
                    >
                      <Icon
                        size={isCompact ? 18 : 22}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={cn(
                          "transition-shadow duration-300",
                          isActive && theme === "dark" ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" : ""
                        )}
                      />
                    </motion.div>
                  </div>
                </motion.button>
              );
            })}
          </nav>
        </div>
      </div>
    );
  },
);
