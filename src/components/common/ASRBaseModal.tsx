/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Share, CornerUpLeft, CornerUpRight, X } from "lucide-react";
import { cn } from "../../lib/asr-utils";

interface ASRBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: any[];
  historyIndex: number;
  onJump?: (index: number) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  theme: "light" | "dark";
  onBack?: () => void;
  onForward?: () => void;
  canForward?: boolean;
  layoutId?: string;
}

import { motion, AnimatePresence } from "motion/react";

export const ModalScrollContext = React.createContext<React.RefObject<HTMLDivElement | null>>({ current: null });

export const ASRBaseModal = React.memo(
  ({
    isOpen,
    onClose,
    history,
    historyIndex,
    onJump,
    children,
    footer,
    theme,
    onBack,
    onForward,
    canForward,
    layoutId,
  }: ASRBaseModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const historyScrollPositions = useRef<Record<number, number>>({});
    const prevIndexRef = useRef(-1);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
      if (copied) {
        const t = setTimeout(() => setCopied(false), 2000);
        return () => clearTimeout(t);
      }
    }, [copied]);

    // Handle scroll restoration within modal history
    useLayoutEffect(() => {
      if (!isOpen) {
        // Reset when closed
        historyScrollPositions.current = {};
        prevIndexRef.current = -1;
        return;
      }

      // Save current scroll before index changes
      if (prevIndexRef.current !== -1 && scrollContainerRef.current) {
        historyScrollPositions.current[prevIndexRef.current] =
          scrollContainerRef.current.scrollTop;
      }

      // Restore or reset scroll for the new index
      if (scrollContainerRef.current) {
        const savedPos = historyScrollPositions.current[historyIndex];
        const targetY = savedPos !== undefined ? savedPos : 0;
        
        const attemptScroll = () => {
           if (scrollContainerRef.current) {
             scrollContainerRef.current.scrollTo({
                top: targetY,
                behavior: "instant",
             });
           }
        };

        attemptScroll();
        requestAnimationFrame(() => {
           attemptScroll();
           setTimeout(attemptScroll, 100);
        });
      }

      prevIndexRef.current = historyIndex;
    }, [historyIndex, isOpen]);

    const handleShare = () => {
      const url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: "Apex Speed Run", url }).catch(() => {
          navigator.clipboard.writeText(url).then(() => setCopied(true)).catch((e) => console.warn("Clipboard copy failed", e));
        });
      } else {
        navigator.clipboard.writeText(url).then(() => setCopied(true)).catch((e) => console.warn("Clipboard copy failed", e));
      }
    };

    useEffect(() => {
      if (isOpen) {
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
          document.body.style.overflow = original;
        };
      }
    }, [isOpen]);

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-auto p-0 sm:p-6 lg:p-12 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all"
              onClick={onClose}
            />
            <motion.div
              ref={modalRef}
              layoutId={layoutId || "global-modal"}
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 500,
              }}
              drag="x"
              dragDirectionLock
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.5 }}
              dragThreshold={20}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.x > 100 || velocity.x > 500) {
                  if (onBack) {
                    onBack();
                  } else if (historyIndex > 0) {
                    onBack?.();
                  } else {
                    onClose();
                  }
                } else if (offset.x < -100 || velocity.x < -500) {
                  if (canForward) {
                    onForward?.();
                  }
                }
              }}
              className={cn(
                "relative flex-1 sm:flex-none flex flex-col w-full h-[100dvh] sm:aspect-[9/19.5] sm:h-auto sm:max-h-[90vh] sm:max-w-[400px] mx-auto sm:rounded-[32px] overflow-hidden shadow-2xl sm:ring-1",
                theme === "dark"
                  ? "bg-zinc-950/95 backdrop-blur-3xl sm:ring-white/10"
                  : "bg-white/95 backdrop-blur-3xl sm:ring-zinc-200",
              )}
            >
              {/* Modal Header - Sticky & Glassy */}
              <div
                className={cn(
                  "sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b min-h-[60px] backdrop-blur-xl pt-[calc(1rem+env(safe-area-inset-top,0px))]",
                  theme === "dark"
                    ? "bg-zinc-950/80 border-white/10"
                    : "bg-white/80 border-zinc-200",
                )}
              >
                {/* Navigation Buttons (Undo/Redo Style) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      if (onBack) {
                        onBack();
                      } else if (historyIndex > 0) {
                        onBack?.();
                      } else {
                        onClose();
                      }
                    }}
                    className={cn(
                      "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      theme === "dark"
                        ? "text-zinc-400 hover:text-white hover:bg-zinc-800/20"
                        : "text-slate-400 hover:text-black hover:bg-slate-100"
                    )}
                    title="Back"
                  >
                    <CornerUpLeft size={20} strokeWidth={2.5} />
                  </button>
                  {canForward && (
                    <button
                      onClick={() => onForward?.()}
                      className={cn(
                        "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        theme === "dark"
                          ? "text-zinc-400 hover:text-white hover:bg-zinc-800/20"
                          : "text-slate-400 hover:text-black hover:bg-slate-100"
                      )}
                      title="Forward"
                    >
                      <CornerUpRight size={20} strokeWidth={2.5} />
                    </button>
                  )}
                </div>

                {/* Breadcrumbs */}
                <div className="flex-1 flex items-center justify-center px-4 overflow-hidden mask-fade-edges">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap px-2">
                    {history &&
                      history.length > 0 &&
                      history.map((item: any, idx: number) => {
                        const isLast = idx === historyIndex;
                        const isFuture = idx > historyIndex;

                        if (isFuture) return null;

                        return (
                          <React.Fragment key={idx}>
                            {idx > 0 && (
                              <span className="text-[8px] font-black opacity-20">
                                /
                              </span>
                            )}
                            <button
                              onClick={() => onJump?.(idx)}
                              disabled={isLast}
                              className={cn(
                                "text-[10px] min-h-[44px] px-2 flex items-center justify-center font-black uppercase tracking-widest transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg",
                                isLast
                                  ? theme === "dark"
                                    ? "text-white"
                                    : "text-zinc-900"
                                  : theme === "dark"
                                    ? "text-zinc-500 hover:text-zinc-300"
                                    : "text-slate-400 hover:text-slate-600",
                              )}
                            >
                              {item.data?.name ||
                                item.data?.courseName ||
                                item.data?.level ||
                                item.data?.athleteName ||
                                "DETAIL"}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>
                </div>

                {/* Close & Share Buttons */}
                <div className="flex items-center gap-1 shrink-0 relative">
                  {copied && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                      COPIED!
                    </div>
                  )}
                  <button
                    onClick={handleShare}
                    className={cn(
                      "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      theme === "dark"
                        ? "text-zinc-500 hover:text-white hover:bg-zinc-800/20"
                        : "text-zinc-500 hover:text-black hover:bg-slate-100"
                    )}
                    title="Share"
                  >
                    <Share size={20} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={onClose}
                    className={cn(
                      "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      theme === "dark"
                        ? "text-zinc-500 hover:text-white hover:bg-zinc-800/20"
                        : "text-zinc-500 hover:text-black hover:bg-slate-100"
                    )}
                    title="Close"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div
                ref={scrollContainerRef}
                className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] touch-pan-y flex flex-col relative pb-[env(safe-area-inset-bottom)]"
              >
                <AnimatePresence
                  mode="popLayout"
                  initial={false}
                  custom={historyIndex > prevIndexRef.current ? 1 : -1}
                >
                  <motion.div
                    key={historyIndex}
                    custom={historyIndex > prevIndexRef.current ? 1 : -1}
                    initial={(d: number) => ({
                      x: d > 0 ? 50 : -50,
                      opacity: 0,
                    })}
                    animate={{ x: 0, opacity: 1 }}
                    exit={(d: number) => ({ x: d > 0 ? -50 : 50, opacity: 0 })}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="flex-1 shrink-0 w-full flex flex-col h-fit"
                  >
                    <ModalScrollContext.Provider value={scrollContainerRef}>
                      {children}
                    </ModalScrollContext.Provider>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              {footer && (
                <div
                  className={cn(
                    "p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] border-t",
                    theme === "dark"
                      ? "bg-zinc-900/10 border-zinc-800"
                      : "bg-white border-slate-100",
                  )}
                >
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  },
);
