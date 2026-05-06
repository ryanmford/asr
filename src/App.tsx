/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useState,
  useCallback,
  useEffect,
  createContext,
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
const SettersView = React.lazy(() => import("./components/views/SettersView").then(m => ({ default: m.SettersView })));
const MapCoursesView = React.lazy(() => import("./components/views/MapCoursesView").then(m => ({ default: m.MapCoursesView })));
const ASRWallOfFame = React.lazy(() => import("./components/views/ASRWallOfFame").then(m => ({ default: m.ASRWallOfFame })));
const InspectorBody = React.lazy(() => import("./components/inspector/InspectorBody").then(m => ({ default: m.InspectorBody })));

import { motion, AnimatePresence } from "motion/react";
import { RouteScrollRestoration } from "./components/common/RouteScrollRestoration";

import { PageHeader } from "./components/common/PageHeader";
import { ViewSkeleton } from "./components/common/Skeletons";
import {
  CONFIG,
  cn,
  trackEvent,
} from "./lib/asr-utils";

// --- CONTEXT & UTILS ---
export const ThemeContext = createContext("dark");

// --- ERROR BOUNDARY ---
import { AlertCircle } from "lucide-react";
import { ErrorBoundary as RouteErrorBoundary } from "./components/common/ErrorBoundary";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  theme: string;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.props = props;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ASR Core Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center p-6 text-center select-none bg-black text-white font-sans",
            this.props.theme === "light" && "bg-zinc-50 text-black",
          )}
        >
          <div className="max-w-md w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-2",
                this.props.theme === "light" ? "bg-zinc-200/50 text-zinc-500" : "bg-zinc-800/50 text-zinc-400"
              )}
            >
              <AlertCircle size={32} strokeWidth={1.5} />
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                Oops, something went wrong
              </h1>
              <p className="text-sm opacity-60 leading-relaxed">
                We're having trouble loading this view. You can try refreshing the page or navigating back.
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "mt-4 px-6 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                this.props.theme === "dark" ? "theme-focus" : "focus-visible:ring-offset-white",
                this.props.theme === "light" ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-white text-black hover:bg-zinc-100"
              )}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- MAIN APP WRAPPER ---

import {
  useURLState,
  useAppNavigation,
  useInspectorData,
} from "./hooks/useDerivedData";
import { useFetchASRData } from "./hooks/useASRData";
import { useDataStore } from "./store/useDataStore";

export default function App() {
  const [theme, setTheme] = useState("dark");
  
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

function MainAppContent({ theme, setTheme }: any) {
  const isLoading = useDataStore((s) => s.isLoading);

  const { eventType, isAllTimeContext, setEventType } = useURLState();
  const { navigateToEntity, closeModals, goBackOne, canGoForward, goForwardOne } = useAppNavigation();

  const [showIntro, setShowIntro] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const p = localStorage.getItem(CONFIG.PREFS_KEY);
    if (p) {
      try {
        const prefs = JSON.parse(p);
        if (prefs.theme) setTheme(prefs.theme);
      } catch (e) {
        console.error("Failed to parse prefs", e);
      }
    }
  }, []);

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

  const [medalSort, setMedalSort] = useState<{ key: string; direction: "ascending" | "descending" }>({ key: "total", direction: "descending" });

  const handleReqSort = useCallback((key: string) => {
    setMedalSort((p) => ({
      key,
      direction: p.key === key && p.direction === "descending" ? "ascending" : "descending",
    }));
  }, []);

  const activeLocation = useLocation();
  const navigate = useNavigate();

  const inspectorDataObj = useInspectorData() || { current: null, history: [], historyIndex: -1 };
  const inspectorData = inspectorDataObj.current;

  const view = activeLocation.pathname.split("/")[1] || "players";

  const handleHome = useCallback(() => {
    navigate("/players");
  }, [navigate]);

  const handleViewChange = useCallback((v: string) => {
    navigate(`/${v}`);
  }, [navigate]);

  return (
    <div
      className={cn(
        "min-h-[100dvh] flex flex-col transition-colors duration-500",
        theme === "dark" 
          ? "dark theme-bg-secondary text-zinc-100 selection:bg-blue-500/30" 
          : "theme-bg-secondary text-zinc-900 selection:bg-blue-500/20",
      )}
    >
      {/* Background Texture/Gradient */}
      <div
        className={cn(
          "fixed inset-0 pointer-events-none transition-opacity duration-1000",
          theme === "dark"
            ? "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.1),rgba(255,255,255,0))] opacity-100"
            : "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(0,0,0,0))] opacity-100",
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

      <div className="w-full flex flex-col pointer-events-auto transition-all duration-300">
        {!isLoading && (
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

      <div className="sticky top-0 z-[70] w-full flex flex-col pointer-events-auto transition-all duration-300">
          <ASRHeader
          theme={theme as "light" | "dark"}
          setTheme={setTheme}
          eventType={eventType as "open" | "all-time"}
          setEventType={setEventType}
          onHome={handleHome}
          hideTabs={view === "wof" || view === "setters"}
        />
      </div>

      <main
        className="flex-1 w-full max-w-7xl mx-auto flex flex-col relative pt-4"
      >
        <div className="flex-1 flex flex-col">
            <RouteErrorBoundary>
            <React.Suspense fallback={
              <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
            <AnimatePresence mode="wait">
              <Routes location={activeLocation} key={activeLocation.pathname}>
                <Route path="/" element={<Navigate to="/players" replace />} />
                <Route path="/players/:id?" element={
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col">
                    <PlayersView theme={theme} />
                  </motion.div>
                } />
                <Route path="/teams/:id?" element={
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col">
                    <TeamsView theme={theme} />
                  </motion.div>
                } />
                <Route path="/setters/:id?" element={
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col">
                    <SettersView theme={theme} />
                  </motion.div>
                } />
                <Route path="/map/:id?" element={<Navigate to="/courses" replace />} />
                <Route path="/courses/:id?" element={
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col">
                    <MapCoursesView theme={theme} />
                  </motion.div>
                } />
                <Route path="/wof" element={
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex flex-col">
                    <PageHeader title="WALL OF FAME" theme={theme} />
                    <ASRWallOfFame
                      theme={theme}
                      onEntityClick={navigateToEntity}
                      medalSort={medalSort as any}
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
                        className="mt-6 px-6 py-2 rounded-full border border-current text-[9px] font-black uppercase tracking-widest hover:bg-current/5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
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
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
            options={(inspectorData as any)?.options}
            onEntityClick={navigateToEntity}
            theme={theme as any}
            initialMode={(inspectorData as any)?.options?.initialMode}
          />
        </React.Suspense>
        </RouteErrorBoundary>
      </ASRBaseModal>

      <ASRVideoModal />
    </div>
  );
}
