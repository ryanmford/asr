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

const PlayersView = React.lazy(() => import("./components/views/PlayersView").then(m => ({ default: m.PlayersView })));
const TeamsView = React.lazy(() => import("./components/views/TeamsView").then(m => ({ default: m.TeamsView })));
const HomeView = React.lazy(() => import("./components/views/HomeView").then(m => ({ default: m.HomeView })));
const MapCoursesView = React.lazy(() => import("./components/views/MapCoursesView").then(m => ({ default: m.MapCoursesView })));
const ASRWallOfFame = React.lazy(() => import("./components/views/ASRWallOfFame").then(m => ({ default: m.ASRWallOfFame })));
const InspectorBody = React.lazy(() => import("./components/inspector/InspectorBody").then(m => ({ default: m.InspectorBody })));

import { motion, AnimatePresence } from "motion/react";
import { RouteScrollRestoration } from "./components/common/RouteScrollRestoration";
import { useAppStore } from "./store/useAppStore";
import { useDataStore } from "./store/useDataStore";

import { PageHeader } from "./components/common/PageHeader";
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
import { useDataStore } from "./store/useDataStore";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof localStorage !== "undefined") {
      const p = localStorage.getItem(CONFIG.PREFS_KEY);
      if (p) {
        try {
          const prefs = JSON.parse(p);
          if (prefs.theme === "light" || prefs.theme === "dark") return prefs.theme;
        } catch (e) {
          console.error("Failed to parse prefs", e);
        }
      }
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

  const { eventType, isAllTimeContext, setEventType } = useURLState();
  const { navigateToEntity, closeModals, goBackOne, canGoForward, goForwardOne } = useAppNavigation();

  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const p = localStorage.getItem(CONFIG.PREFS_KEY);
    const parsed = p ? JSON.parse(p) : {};
    parsed.theme = theme;
    localStorage.setItem(CONFIG.PREFS_KEY, JSON.stringify(parsed));
    
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

  const view = backgroundLocation.pathname.split("/")[1] || "players";

  const handleHome = useCallback(() => {
    navigate("/home");
  }, [navigate]);

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
        "min-h-[100dvh] flex flex-col transition-colors duration-500",
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

      <div className="w-full flex flex-col pointer-events-auto transition-all duration-300 pt-[env(safe-area-inset-top,0px)]">
        {!isLoading && view !== "courses" && (
          <div className="flex flex-col">
            <ASRLiveTicker
              theme={theme}
              onEntityClick={navigateToEntity}
            />
            <ASRCountdown
              targetDate={
                isAllTimeContext
                  ? "2024-01-01T00:00:00Z"
                  : CONFIG.DATES.COUNTDOWN_TARGET
              }
              eventType={eventType as "open" | "all-time"}
              onHelp={() => setShowOnboarding(true)}
              theme={theme as "light" | "dark"}
            />
          </div>
        )}
      </div>

      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] h-[env(safe-area-inset-top)] backdrop-blur-xl border-b",
          theme === "dark" ? "bg-zinc-950/80 border-white/5" : "bg-white/80 border-black/5"
        )}
      />

      <div 
        className="sticky z-[70] w-full flex flex-col pointer-events-auto transition-all duration-300"
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
          <ASRHeader
          theme={theme as "light" | "dark"}
          setTheme={setTheme}
          eventType={eventType as "open" | "all-time"}
          setEventType={setEventType}
          onHome={handleHome}
          hideTabs={view === "hof" || view === "setters" || view === "home"}
        />
      </div>

      <main
        className="flex-1 w-full max-w-7xl mx-auto flex flex-col relative pt-0 sm:pt-4"
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
                <Route path="/players/:id?" element={
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col">
                    <PlayersView theme={theme} />
                  </motion.div>
                } />
                <Route path="/teams/:id?" element={
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col">
                    <TeamsView theme={theme} />
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
                    <PageHeader title="HALL OF FAME" theme={theme} />
                    <ASRWallOfFame
                      theme={theme}
                      onEntityClick={navigateToEntity}
                      medalSort={medalSort as "copper" | "silver" | "gold"}
                      onMedalSort={handleReqSort}
                    />
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
                          navigate("/players", { replace: false });
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
        <ASRFooter />
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
    </div>
  );
}
