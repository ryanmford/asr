/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useState,
  useCallback,
  useEffect,
} from "react";
import { useLocation, useNavigate, Routes, Route, Navigate } from "react-router-dom";
import {
  AlertCircle,
} from "lucide-react";
import {
  ASRHeader,
  ASRNavDock,
  ASRLiveTicker,
  ASRBaseModal,
  ASRIntroOverlay,
  ASROnboarding,
  ASRCountdown,
  ASRFooter,
} from "./components/ASRComponents";
import { ASRVideoModal } from "./components/common/ASRVideoModal";
import { ASRSubmitModal } from "./components/common/ASRSubmitModal";

const RankingsView = React.lazy(() => import("./components/views/RankingsView").then(m => ({ default: m.RankingsView })));
const HomeView = React.lazy(() => import("./components/views/HomeView").then(m => ({ default: m.HomeView })));
const MapCoursesView = React.lazy(() => import("./components/views/MapCoursesView").then(m => ({ default: m.MapCoursesView })));
const ASRWallOfFame = React.lazy(() => import("./components/views/ASRWallOfFame").then(m => ({ default: m.ASRWallOfFame })));
const ASRVideoAnnotator = React.lazy(() => import("./components/views/ASRVideoAnnotator").then(m => ({ default: m.ASRVideoAnnotator })));
const InspectorBody = React.lazy(() => import("./components/inspector/InspectorBody").then(m => ({ default: m.InspectorBody })));

import { motion, AnimatePresence } from "motion/react";
import { RouteScrollRestoration } from "./components/common/RouteScrollRestoration";
import { useAppStore } from "./store/useAppStore";
import { useDataStore } from "./store/useDataStore";

import {
  CONFIG,
  cn,
  trackEvent,
  trackPageview,
} from "./lib/asr-utils";

// --- CONTEXT & UTILS ---
import { ThemeContext } from "./theme-context"; // if needed
import { GlobalErrorBoundary } from "./components/common/GlobalErrorBoundary";
import { ErrorBoundary as RouteErrorBoundary } from "./components/common/ErrorBoundary";

// --- MAIN APP WRAPPER ---

import {
  useURLState,
  useAppNavigation,
  useInspectorData,
} from "./hooks/useDerivedData";
import { useFetchASRData } from "./hooks/useASRData";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      if (typeof localStorage !== "undefined") {
        const p = localStorage.getItem(CONFIG.PREFS_KEY);
        if (p) {
          const prefs = JSON.parse(p);
          if (prefs.theme === "light" || prefs.theme === "dark") return prefs.theme;
        }
      }
    } catch (e) {
      console.warn("localStorage not available in current environment", e);
    }
    if (typeof window !== "undefined" && window.matchMedia) {
      if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
    }
    return "dark";
  });
  
  // Initiate global data fetching
  useFetchASRData();

  return (
    <GlobalErrorBoundary theme={theme}>
      <ThemeContext.Provider value={theme}>
        <MainAppContent theme={theme} setTheme={setTheme} />
      </ThemeContext.Provider>
    </GlobalErrorBoundary>
  );
}

function MainAppContent({ theme, setTheme }: { theme: "light" | "dark", setTheme: (theme: "light" | "dark") => void }) {
  const isLoading = useDataStore((s) => s.isLoading);
  const showOnboarding = useAppStore((s) => s.showOnboarding);
  const setShowOnboarding = useAppStore((s) => s.setShowOnboarding);

  const { eventType, setEventType } = useURLState();
  const { navigateToEntity, closeModals, goBackOne, canGoForward, goForwardOne } = useAppNavigation();

  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    try {
      const p = localStorage.getItem(CONFIG.PREFS_KEY);
      const parsed = p ? JSON.parse(p) : {};
      parsed.theme = theme;
      localStorage.setItem(CONFIG.PREFS_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.warn("Could not write theme to localStorage:", e);
    }
    
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.backgroundColor = "#030303";
      document.body.style.backgroundColor = "#030303";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.backgroundColor = "#FAFAFA";
      document.body.style.backgroundColor = "#FAFAFA";
    }
  }, [theme]);

  const [medalSort, setMedalSort] = useState<{ key: string; direction: "ascending" | "descending" }>({ key: "gold", direction: "descending" });

  const handleReqSort = useCallback((key: string) => {
    setMedalSort((p) => ({
      key,
      direction: p.key === key && p.direction === "descending" ? "ascending" : "descending",
    }));
  }, []);

  const activeLocation = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    trackPageview(activeLocation.pathname);
  }, [activeLocation.pathname]);

  let backgroundLocation = activeLocation;
  while (backgroundLocation.state && (backgroundLocation.state as { backgroundLocation?: typeof activeLocation }).backgroundLocation) {
    backgroundLocation = (backgroundLocation.state as { backgroundLocation: typeof activeLocation }).backgroundLocation;
  }

  const inspectorDataObj = useInspectorData() || { current: null, history: [], historyIndex: -1 };
  const inspectorData = inspectorDataObj.current;

  const view = backgroundLocation.pathname.split("/")[1] || "rankings";

  const handleViewChange = useCallback((v: string) => {
    navigate(`/${v}`);
  }, [navigate]);

  const lastInspectorLayoutId = React.useRef<string | null>(null);
  if (inspectorData?.data) {
    lastInspectorLayoutId.current = `card-${inspectorData.data.id || inspectorData.data.name || 'empty'}`;
  }

  return (
    <div
      className={cn(
        "flex flex-col transition-colors duration-500",
        view === "courses" ? "fixed inset-0 overflow-hidden" : "min-h-[100dvh]",
        theme === "dark" 
          ? "dark theme-bg-base text-zinc-100 selection:bg-blue-500/30" 
          : "theme-bg-base text-zinc-900 selection:bg-blue-500/20",
      )}
    >
      {/* Background Texture/Gradient */}
      <div
        className={cn(
          "fixed inset-0 pointer-events-none transition-opacity duration-1000",
          theme === "dark"
            ? "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(161,161,170,0.1),rgba(255,255,255,0))] opacity-100" // zinc-400
            : "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(161,161,170,0.15),rgba(0,0,0,0))] opacity-100",
        )}
      />
      
      {/* Global Noise Texture */}
      <div 
        className={cn(
          "fixed inset-0 pointer-events-none textured-surface transition-opacity duration-500",
          theme === "dark" ? "opacity-[0.03] mix-blend-screen" : "opacity-[0.04] mix-blend-multiply"
        )} 
      />

      <RouteScrollRestoration />

      {showIntro && (
        <ASRIntroOverlay
          theme={theme}
          onStart={() => {
            setShowIntro(false);
            trackEvent("initialize_app", { source: "intro_button" });
          }}
        />
      )}
      <ASROnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      <div className="w-full flex flex-col pointer-events-auto transition-all duration-300 pt-[env(safe-area-inset-top,0px)] relative z-[80]">
        {!isLoading && (
          <div className="flex flex-col">
            {view === "home" && (
              <ASRLiveTicker
                theme={theme}
                onEntityClick={navigateToEntity}
              />
            )}
            {(view === "home" || view === "rankings") && (
              <ASRCountdown
                targetDate={CONFIG.DATES.COUNTDOWN_TARGET}
                eventType={"open"}
                onHelp={() => setShowOnboarding(true)}
                theme={theme as "light" | "dark"}
              />
            )}
          </div>
        )}
      </div>

      <div 
        className={cn(
          "w-full flex flex-col pointer-events-auto transition-all duration-300",
          "sticky z-[70]"
        )}
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
          <ASRHeader
          theme={theme as "light" | "dark"}
          setTheme={setTheme}
          eventType={eventType as "open" | "all-time"}
          setEventType={setEventType}
          hideTabs={view === "hof" || view === "setters" || view === "home"}
          isTransparent={view === "home"}
          showSearch={view === "home"}
          leftSlot={view === "hof" ? (
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-black italic uppercase tracking-widest text-zinc-900 dark:text-zinc-100">HALL OF FAME</h1>
            </div>
          ) : undefined}
        />
      </div>

      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] h-[env(safe-area-inset-top)] backdrop-blur-xl border-b transition-colors duration-500",
          view === "home" 
            ? "bg-transparent border-transparent" 
            : theme === "dark" ? "bg-zinc-950/80 border-white/5" : "bg-white/80 border-black/5"
        )}
      />

      <main
        className={cn(
          "flex-1 w-full mx-auto flex flex-col relative",
          (view === "courses" || view === "admin") ? "max-w-none pt-0" : "max-w-7xl pt-0 sm:pt-4",
          view === "home" ? "pt-0 -mt-[140px] sm:-mt-[160px]" : ""
        )}
      >
        <div className="flex-1 flex flex-col">
            <RouteErrorBoundary>
            <React.Suspense fallback={
              <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-zinc-900 dark:border-zinc-100 border-t-transparent dark:border-t-transparent rounded-full animate-spin opacity-50" />
              </div>
            }>
            <AnimatePresence mode="wait">
              <Routes location={backgroundLocation} key={backgroundLocation.pathname}>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/rankings" element={
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col">
                    <RankingsView theme={theme} />
                  </motion.div>
                } />
                <Route path="/regions/:id?" element={
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col">
                    <RankingsView theme={theme} />
                  </motion.div>
                } />
                <Route path="/setters/:id?" element={
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col">
                    <RankingsView theme={theme} />
                  </motion.div>
                } />
                <Route path="/home" element={
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col">
                    <HomeView />
                  </motion.div>
                } />
                <Route path="/map/:id?" element={<Navigate to="/courses" replace />} />
                <Route path="/courses/:id?" element={
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col">
                    <MapCoursesView theme={theme} />
                  </motion.div>
                } />
                <Route path="/hof" element={
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col">
                    <ASRWallOfFame
                      theme={theme}
                      onEntityClick={navigateToEntity}
                      medalSort={medalSort}
                      onMedalSort={handleReqSort}
                    />
                  </motion.div>
                } />
                <Route path="/admin/annotator" element={
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col bg-black min-h-0 z-50 relative">
                    <ASRVideoAnnotator theme={theme} />
                  </motion.div>
                } />
                <Route path="*" element={
                  !isLoading ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
                      <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-current mb-4 flex items-center justify-center">
                        <AlertCircle size={24} />
                      </div>
                      <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-2">
                        PAGE NOT FOUND
                      </h2>
                      <p className="text-[10px] font-medium tracking-widest max-w-[200px]">
                        THE REQUESTED VIEW "{view.toUpperCase()}" IS NOT AVAILABLE.
                      </p>
                      <button
                        onClick={() => {
                          navigate("/rankings", { replace: false });
                        }}
                        className="mt-6 px-6 py-2 rounded-full border border-current text-[9px] font-black uppercase tracking-widest hover:bg-current/5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95"
                      >
                        RETURN HOME
                      </button>
                    </motion.div>
                  ) : <div />
                } />
              </Routes>
            </AnimatePresence>
          </React.Suspense>
          </RouteErrorBoundary>
        </div>
        {view !== "courses" && <ASRFooter />}
      </main>

      <ASRNavDock currentView={view} setView={handleViewChange} theme={theme} />

      {/* Details Modal */}
      <ASRBaseModal
        layoutId={lastInspectorLayoutId.current || undefined}
        isOpen={Boolean(inspectorData)}
        onClose={closeModals}
        onBack={goBackOne}
        onForward={goForwardOne}
        canForward={canGoForward}
        theme={theme}
        history={inspectorDataObj.history}
        historyIndex={inspectorDataObj.historyIndex}
        onJump={(idx) => {
            const spacesToGoBack = inspectorDataObj.historyIndex - idx;
            if (spacesToGoBack > 0) {
                let targetLoc = activeLocation;
                for (let i = 0; i < spacesToGoBack; i++) {
                    if (targetLoc.state?.backgroundLocation) {
                        targetLoc = targetLoc.state.backgroundLocation;
                    }
                }
                navigate(`${targetLoc.pathname}${targetLoc.search}`, {
                    state: targetLoc.state,
                    replace: true
                });
            }
        }}
        title={
          inspectorData?.data?.name ||
          inspectorData?.data?.courseName ||
          inspectorData?.data?.athleteName ||
          "Detail"
        }
      >
        <RouteErrorBoundary>
            <React.Suspense fallback={
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-10 h-10 border-4 border-zinc-900 dark:border-zinc-100 border-t-transparent dark:border-t-transparent rounded-full animate-spin opacity-50" />
          </div>
        }>
          <InspectorBody
            key={
              inspectorData
                ? `${inspectorData.type}-${inspectorData.data?.name || inspectorData.data?.pKey}`
                : "empty"
            }
            item={inspectorData?.data}
            type={inspectorData?.type}
            options={(inspectorData as { options?: Record<string, unknown> })?.options}
            onEntityClick={navigateToEntity}
            theme={theme}
            initialMode={(inspectorData as { options?: { initialMode?: "open" | "all-time" } })?.options?.initialMode}
          />
        </React.Suspense>
        </RouteErrorBoundary>
      </ASRBaseModal>

      <ASRVideoModal />
      <ASRSubmitModal />
    </div>
  );
}
