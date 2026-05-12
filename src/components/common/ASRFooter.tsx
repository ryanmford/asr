import React, { useContext, useState } from "react";
import { cn } from "../../lib/asr-utils";
import { ThemeContext } from "../../theme-context";
import { useDataStore } from "../../store/useDataStore";
import { motion, AnimatePresence } from "motion/react";
import { X, Instagram, Youtube, Link, RefreshCw, CheckCircle2 } from "lucide-react";

export const ASRFooter = React.memo(() => {
  const theme = useContext(ThemeContext);
  const [activeModal, setActiveModal] = useState<"about" | "privacy" | "terms" | null>(null);
  const lastUpdated = useDataStore((s) => s.lastUpdated);
  const isLoading = useDataStore((s) => s.isLoading);

  const modalContent = {
    about: {
      title: "About",
      content: (
        <div className="space-y-4">
          <p>Apex Speed Run is a global parkour leaderboard tracking the fastest runs across iconic and local spots worldwide.</p>
          <p>Built for the community, by the community, our goal is to push the limits of human movement and connect athletes through standardized time trials.</p>
          <p>Get out there, find a course, and set a time.</p>
        </div>
      )
    },
    privacy: {
      title: "Privacy Policy",
      content: (
        <div className="space-y-4">
          <p>We respect your privacy. This application is currently in beta. We collect basic analytics and authentication data necessary to run the leaderboards.</p>
          <p>We do not sell your data. Videos submitted for run verification are public. If you wish to have your data or account removed, please contact the administrators.</p>
        </div>
      )
    },
    terms: {
      title: "Terms of Service & Assumption of Risk",
      content: (
        <div className="space-y-4 text-sm">
          <p className="font-bold text-red-500/80 dark:text-red-400">WARNING: PARKOUR IS AN INHERENTLY DANGEROUS ACTIVITY.</p>
          <p>By participating in Apex Speed Run ("ASR") or attempting any courses listed on this platform, you acknowledge and agree to the following:</p>
          <ul className="list-disc pl-5 space-y-2 opacity-80">
            <li><strong>Dynamic Environments:</strong> Courses are located in outdoor, public spaces. These are chaotic, uncontrolled environments that change constantly due to weather, maintenance, public use, and wear-and-tear.</li>
            <li><strong>No Safety Guarantee:</strong> ASR does not monitor, maintain, or guarantee the safety, legality, or structural integrity of any course or spot. A spot that was safe yesterday may be dangerous today.</li>
            <li><strong>100% Personal Responsibility:</strong> It is entirely your responsibility to check surfaces, test structures, assess weather conditions, and ensure your own physical capability before running.</li>
            <li><strong>Assumption of Risk:</strong> You assume all risks of injury, paralysis, or death associated with training. ASR, its creators, and course submitters are NOT liable for any injuries, damages, or legal consequences resulting from your attempts.</li>
            <li><strong>Respect the Space:</strong> Do not trespass on private property. Be respectful of pedestrians and public infrastructure. If a spot is closed or crowded, come back later.</li>
          </ul>
          <p className="pt-4 font-bold">Know your limits. Check your surfaces. Train safe.</p>
        </div>
      )
    }
  };

  return (
    <>
      <footer
        className={cn(
          "w-full py-16 px-6 mt-16 border-t flex flex-col items-center gap-8 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-[calc(4rem+env(safe-area-inset-bottom,0px))] transition-colors duration-500",
          theme === "dark"
            ? "bg-zinc-950 text-zinc-400 border-zinc-800/50"
            : "bg-slate-50 text-slate-500 border-slate-200/50"
        )}
      >
        <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-7xl gap-6">
          <div className="flex items-center gap-4 text-zinc-400">
            <a href="https://www.instagram.com/apexspeedrun/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://www.youtube.com/apexmovement" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors">
              <Youtube className="w-5 h-5" />
            </a>
            <a href="https://beacons.ai/apexspeedrun" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">
              <Link className="w-5 h-5" />
            </a>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-6 text-[9px] sm:text-[11px] font-bold tracking-widest uppercase transition-colors shrink-0 whitespace-nowrap">
            <button onClick={() => setActiveModal("about")} className="hover:text-blue-500 transition-colors uppercase tracking-widest flex-shrink-0">About</button>
            <button onClick={() => setActiveModal("privacy")} className="hover:text-blue-500 transition-colors uppercase tracking-widest flex-shrink-0">Privacy Policy</button>
            <button onClick={() => setActiveModal("terms")} className="hover:text-blue-500 transition-colors uppercase tracking-widest flex-shrink-0">Terms of Service</button>
          </div>
        </div>

        <div className="w-full max-w-7xl flex flex-col-reverse md:flex-row items-center justify-between pt-8 border-t border-current/10 text-[10px] font-bold uppercase tracking-widest opacity-40 gap-4">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} APEX SPEED RUN</span>
          </div>

          <div className="flex items-center gap-2 relative">
            {isLoading ? (
              <div className="flex items-center gap-2 text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Syncing Live Data...</span>
              </div>
            ) : lastUpdated ? (
              <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                <span>STATS UPDATED: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ) : null}
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-hidden pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={cn(
                "relative w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]",
                theme === "dark" ? "bg-zinc-900 text-zinc-100 ring-1 ring-white/10" : "bg-white text-slate-900 ring-1 ring-slate-200"
              )}
            >
              <div className={cn(
                "flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10 backdrop-blur-xl",
                theme === "dark" ? "border-white/10 bg-zinc-900/80" : "border-slate-200 bg-white/80"
              )}>
                <h2 className="text-lg font-black tracking-tight uppercase">{modalContent[activeModal].title}</h2>
                <button
                  onClick={() => setActiveModal(null)}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    theme === "dark" ? "hover:bg-white/10" : "hover:bg-slate-100"
                  )}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto leading-relaxed">
                {modalContent[activeModal].content}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
});
