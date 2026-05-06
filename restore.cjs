const fs = require('fs');

const missingChunk = `                this.props.theme === "dark" ? "focus-visible:ring-offset-[#030303]" : "focus-visible:ring-offset-white",
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

export default function App() {
  const [theme, setTheme] = useState("dark");
  
  // Initiate global data fetching
  useFetchASRData();

  return (
    <ErrorBoundary theme={theme}>
      <ThemeContext.Provider value={theme}>
        <MainAppContent theme={theme} setTheme={setTheme} />
      </ThemeContext.Provider>
    </ErrorBoundary>
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
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const p = localStorage.getItem(CONFIG.PREFS_KEY);
    const parsed = p ? JSON.parse(p) : {};
    parsed.theme = theme;
    localStorage.setItem(CONFIG.PREFS_KEY, JSON.stringify(parsed));
    
    if (theme === "dark") {
      document.documentElement.style.backgroundColor = "#030303";
      document.body.style.backgroundColor = "#030303";
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.style.backgroundColor = "#FAFAFA";
      document.body.style.backgroundColor = "#FAFAFA";
      document.documentElement.classList.remove("dark");
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

  return (
    <div
      className={cn(
        "min-h-[100dvh] flex flex-col transition-colors duration-500",
        theme === "dark"
          ? "dark bg-zinc-950 text-zinc-100 selection:bg-blue-500/30"
          : "bg-[#FAFAFA] text-zinc-900 selection:bg-blue-500/20"
`;

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /this\.props\.theme === \"dark\" \? \"dark bg-zinc-950 text-zinc-100 selection:bg-blue-500\/30\" \: \"bg-\[\#FAFAFA\] text-zinc-900 selection:bg-blue-500\/20\",\s*}\)\s*>/,
  missingChunk
);

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx restored.');
