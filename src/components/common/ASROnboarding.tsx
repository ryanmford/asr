import React, { useState, useEffect, useMemo, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass,
  MapPin,
  Video,
  ShieldCheck,
  X,
  CornerUpLeft,
  CornerUpRight,
  ChevronRight,
} from "lucide-react";
import { ThemeContext } from "../../App";
import { CONFIG, trackEvent, cn } from "../../lib/asr-utils";

import { ASRPremiumButton } from "../ui/ASRPremiumButton";

interface ASROnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ASROnboarding = ({ isOpen, onClose }: ASROnboardingProps) => {
  const theme = useContext(ThemeContext);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let original = "";
    if (isOpen) {
      original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      setStep(0);
      trackEvent("view_item", {
        item_name: "onboarding_modal",
        item_category: "modal",
      });
    }
    return () => {
      if (isOpen) {
        document.body.style.overflow = original;
      }
    };
  }, [isOpen]);

  const steps = useMemo(
    () => [
      {
        title: "HOW TO START",
        desc: "Our courses are set in outdoor, public spaces. You can start anytime.",
        icon: <Compass />,
      },
      {
        title: "1. Find a course",
        desc: (
          <>
            Use our map and course guides to find a course near you. Join{" "}
            <a
              href={CONFIG.SKOOL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-inherit hover:text-blue-500 transition-colors"
              onClick={() =>
                trackEvent("outbound_click", {
                  link_url: CONFIG.SKOOL_LINK,
                  link_type: "onboarding_skool",
                })
              }
            >
              Apex Skool app
            </a>{" "}
            to access the latest ASR resources.
          </>
        ),
        icon: <MapPin />,
      },
      {
        title: "2. Film your run",
        desc: (
          <>
            Video proof is everything. Check{" "}
            <a
              href={CONFIG.SKOOL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-inherit hover:text-blue-500 transition-colors"
              onClick={() =>
                trackEvent("outbound_click", {
                  link_url: CONFIG.SKOOL_LINK,
                  link_type: "onboarding_skool",
                })
              }
            >
              Apex Skool app
            </a>{" "}
            for filming requirements and official rules to ensure that your best
            runs count.
          </>
        ),
        icon: <Video />,
      },
      {
        title: "3. Get verified",
        desc: (
          <>
            Post your fastest runs in{" "}
            <a
              href={CONFIG.SKOOL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-inherit hover:text-blue-500 transition-colors"
              onClick={() =>
                trackEvent("outbound_click", {
                  link_url: CONFIG.SKOOL_LINK,
                  link_type: "onboarding_skool",
                })
              }
            >
              Apex Skool app
            </a>{" "}
            for official review. Once verified, your stats will update and
            broadcast live on our website.
          </>
        ),
        icon: <ShieldCheck />,
        action: "JOIN",
      },
    ],
    [],
  );

  if (!isOpen) return null;

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      trackEvent("tutorial_next", { step: step + 1 });
    }
  };
  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-3xl transition-colors duration-500",
            theme === "dark" ? "bg-black/95" : "bg-white/95",
          )}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={cn(
              "w-full max-w-xl rounded-[3rem] p-8 sm:p-14 border shadow-[0_20px_100px_rgba(0,0,0,0.4)] relative overflow-hidden ios-clip-fix mt-[var(--safe-top)] transition-colors duration-500 backdrop-blur-3xl",
              theme === "dark"
                ? "bg-zinc-950/80 border-white/10 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "bg-white/90 border-zinc-200 text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,1)]",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

            <button
              onClick={step > 0 ? prevStep : onClose}
              className={cn(
                "absolute top-8 left-8 p-3 rounded-full transition-all z-20 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95",
                theme === "dark"
                  ? "hover:bg-white/10 text-zinc-400 hover:text-white"
                  : "hover:bg-black/10 text-zinc-500 hover:text-black",
              )}
              title={step > 0 ? "Go Back" : "Close"}
            >
              <CornerUpLeft
                className="w-5 h-5 sm:w-6 sm:h-6"
                strokeWidth={2.5}
              />
            </button>

            <button
              onClick={onClose}
              className={cn(
                "absolute top-8 right-8 p-3 rounded-full transition-all z-20 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95",
                theme === "dark"
                  ? "hover:bg-white/10 text-zinc-400 hover:text-white"
                  : "hover:bg-black/10 text-zinc-500 hover:text-black",
              )}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
            </button>

            <div className="flex flex-col items-start text-left space-y-8 sm:space-y-10 relative z-10 pt-12 sm:pt-0 w-full">
              <motion.div
                key={step}
                initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                className={cn(
                  "self-center w-20 h-20 sm:w-28 sm:h-28 rounded-[1.8rem] sm:rounded-[2.5rem] flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden",
                  theme === "dark" ? "bg-blue-500/20" : "bg-blue-500/10",
                )}
              >
                <div className="absolute inset-0 bg-blue-500 animate-pulse opacity-10" />
                {React.cloneElement(steps[step].icon as React.ReactElement<any>, {
                  className:
                    "relative z-10 w-10 h-10 sm:w-14 sm:h-14 text-blue-500",
                  strokeWidth: 2.5,
                })}
              </motion.div>

              <div className="space-y-5 w-full">
                <motion.h2
                  key={step + "-title"}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="text-4xl sm:text-5xl font-black uppercase tracking-tighter italic leading-[0.9] whitespace-normal break-words text-left"
                >
                  {steps[step].title}
                </motion.h2>
                <motion.div
                  key={step + "-desc"}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg sm:text-xl font-black opacity-70 leading-relaxed text-inherit whitespace-normal break-words w-full text-left"
                >
                  {steps[step].desc}
                </motion.div>
              </div>

              <div className="flex gap-2.5 py-2 justify-start w-full">
                {steps.map((s, i) => (
                  <div
                    key={s.title}
                    className={cn(
                      "h-2.5 rounded-full transition-all duration-500",
                      i === step
                        ? "w-14 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                        : "w-4 bg-current opacity-20",
                    )}
                  />
                ))}
              </div>

              <div className="w-full flex flex-col items-center gap-4">
                <div className="flex gap-4 w-full">
                  {steps[step].action ? (
                    <ASRPremiumButton
                      href={CONFIG.SKOOL_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackEvent("outbound_click", {
                          link_url: CONFIG.SKOOL_LINK,
                          link_type: "onboarding_action",
                        })
                      }
                      theme={theme as "light" | "dark"}
                      className="flex-1"
                      variant="solid"
                    >
                      {steps[step].action}{" "}
                      <CornerUpRight
                        className="w-5 h-5 flex-shrink-0"
                        strokeWidth={2.5}
                      />
                    </ASRPremiumButton>
                  ) : (
                    <ASRPremiumButton
                      onClick={nextStep}
                      theme={theme as "light" | "dark"}
                      className="flex-1"
                      variant="solid"
                    >
                      Next{" "}
                      <ChevronRight
                        className="w-5 h-5 flex-shrink-0"
                        strokeWidth={2.5}
                      />
                    </ASRPremiumButton>
                  )}
                </div>
                <button
                  onClick={() => {
                    trackEvent("tutorial_skip", { step: step });
                    onClose();
                  }}
                  className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 hover:opacity-100 transition-all p-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md active:scale-95"
                >
                  Skip
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
