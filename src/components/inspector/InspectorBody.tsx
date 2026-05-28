import React from "react";
import { useDataStore } from "../../store/useDataStore";
import { useSettersDerived } from "../../hooks/useDerivedData";
import { useLeaderboards } from "../../hooks/useAppCalculations";
import { DetailsSkeleton } from "../common/Skeletons";
import { cn, getCombinedFlags, formatFlagsWithSpace, normalizeName } from "../../lib/asr-utils";
import { SearchX, AlertCircle } from "lucide-react";
import { FallbackAvatar } from "../common/FallbackAvatar";

export const ASRProfileHeader = React.memo(({
  type,
  data,
  theme,
  pRaw,
}: {
  type: string;
  data: any;
  theme: "light" | "dark";
  pRaw?: Record<string, any>;
}) => {
  if (!data) return null;
  const isDark = theme === "dark";
  
  const title = data.name || data.meta?.name || "PROFILE";
  let flags = "";
  let statLabel = "";
  let statValue = "";

  if (type === "player" || type === "setter") {
    const meta = data.meta || data;
    flags = getCombinedFlags(meta);
    const safeKey = normalizeName(title);
    if (pRaw && pRaw[safeKey]) {
       statLabel = "LQ";
       statValue = pRaw[safeKey].LQ?.toFixed(2) || "0.00";
    }
  } else if (type === "team") {
    const tMeta = data.meta || {};
    flags = formatFlagsWithSpace(tMeta.region || tMeta.flag || tMeta.country || data.region || data.flag || data.country) || "🛡️";
  } else if (type === "region") {
    const rMeta = data.meta || {};
    flags = formatFlagsWithSpace(rMeta.flag || data.flag || rMeta.country || data.country) || "📍";
  } else if (type === "course") {
    const cMeta = data.meta || {};
    flags = formatFlagsWithSpace(cMeta.country || cMeta.region || data.country || data.region) || "🏁";
    statLabel = "CHK";
    statValue = String(cMeta.checkpoints || data.checkpoints || 0);
  }

  return (
    <div className={cn(
      "px-4 py-3 flex items-center gap-4 relative overflow-hidden transition-colors border-b",
      isDark ? "bg-[#030303] border-white/5 text-white" : "bg-white border-black/5 text-black"
    )}>
      {/* Background Element */}
      <div className={cn(
        "absolute inset-0 pointer-events-none opacity-40",
        isDark 
          ? "bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.06),transparent_60%)]" 
          : "bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.04),transparent_60%)]"
      )} />

       <div className="relative shrink-0 z-10 w-[42px] h-[42px] sm:w-[50px] sm:h-[50px] rounded-full p-[2px] overflow-hidden transition-all duration-300">
          <div className="w-full h-full rounded-full bg-[#030303] flex items-center justify-center overflow-hidden">
             <FallbackAvatar name={title} sizeCls="text-xl" />
          </div>
       </div>

       <div className="flex-1 min-w-0 z-10 flex flex-col justify-center">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2 truncate whitespace-nowrap">
            <span className="shrink-0">{flags}</span>
            <span className="truncate">{title}</span>
          </h1>
       </div>

       {statValue && (
         <div className="shrink-0 z-10 text-right pr-2">
           <div className="text-[9px] font-bold uppercase tracking-[0.15em] opacity-50 mb-0.5">{statLabel}</div>
           <div className="text-lg sm:text-xl font-black tracking-tighter leading-none">{statValue}</div>
         </div>
       )}
    </div>
  );
});

const PlayerDetails = React.lazy(() =>
  import("./PlayerDetails").then((m) => ({ default: m.PlayerDetails })),
);
const CourseDetails = React.lazy(() =>
  import("./CourseDetails").then((m) => ({ default: m.CourseDetails })),
);
const TeamDetails = React.lazy(() =>
  import("./TeamDetails").then((m) => ({ default: m.TeamDetails })),
);
const RegionDetails = React.lazy(() =>
  import("./RegionDetails").then((m) => ({ default: m.RegionDetails })),
);

interface InspectorBodyProps {
  type: string;
  data?: Record<string, unknown>;
  item?: Record<string, unknown>;
  options?: Record<string, unknown>;
  onEntityClick: (type: string, data: Record<string, unknown>) => void;
  theme: "light" | "dark";
  initialMode?: "open" | "all-time";
  isNotFound?: boolean;
  requestedId?: string;
}

export const InspectorBody = React.memo(
  ({
    type,
    data,
    item,
    options,
    onEntityClick,
    theme,
    initialMode,
    isNotFound,
    requestedId,
  }: InspectorBodyProps) => {
    const dataCore = useDataStore((s) => s.data);
    const atPerfs = useDataStore((s) => s.atPerfs);
    const opPerfs = useDataStore((s) => s.opPerfs);
    const atMet = useDataStore((s) => s.atMet);
    const openData = useDataStore((s) => s.openData);
    const cMet = useDataStore((s) => s.cMet);
    const atRawBest = useDataStore((s) => s.atRawBest);
    const opRawBest = useDataStore((s) => s.opRawBest);
    const lbAT = useDataStore((s) => s.lbAT);
    const lbOpen = useDataStore((s) => s.lbOpen);
    const teamsAggregated = useDataStore((s) => s.teamsAggregated);
    const courseRunsHistory = useDataStore((s) => s.courseRunsHistory);
    const masterCourseList = useDataStore((s) => s.masterCourseList);

    const courseRecords_M_AT = useDataStore((s) => s.courseRecords_M_AT);
    const courseRecords_F_AT = useDataStore((s) => s.courseRecords_F_AT);
    const courseRecords_M_OP = useDataStore((s) => s.courseRecords_M_OP);
    const courseRecords_F_OP = useDataStore((s) => s.courseRecords_F_OP);

    const { settersWithImpact, setterMet } = useSettersDerived();
    const { pRaw, playerLB_AT, playerLB_OP } = useLeaderboards();

    const dataContext = React.useMemo(() => ({
      data: dataCore,
      atPerfs: atPerfs,
      opPerfs: opPerfs,
      atMet: atMet,
      openData: openData,
      cMet: cMet,
      lbAT: playerLB_AT,
      lbOP: playerLB_OP,
      setterMet: setterMet,
      pRaw: pRaw,
      settersWithImpact: settersWithImpact,
      atRawBest: atRawBest,
      opRawBest: opRawBest,
      lbAT_Courses: lbAT,
      lbOP_Courses: lbOpen,
      teamsAggregated: teamsAggregated,
      courseRunsHistory: courseRunsHistory,
      masterCourseList: masterCourseList,
      courseRecords_M_AT: courseRecords_M_AT,
      courseRecords_F_AT: courseRecords_F_AT,
      courseRecords_M_OP: courseRecords_M_OP,
      courseRecords_F_OP: courseRecords_F_OP,
    }), [
      dataCore, atPerfs, opPerfs, atMet, openData, cMet, 
      playerLB_AT, playerLB_OP, setterMet, pRaw, 
      settersWithImpact, atRawBest, opRawBest, lbAT, 
      lbOpen, teamsAggregated, courseRunsHistory, masterCourseList,
      courseRecords_M_AT, courseRecords_F_AT, courseRecords_M_OP, courseRecords_F_OP
    ]);

    const finalData = data || item;
    const finalMode = initialMode || options?.initialMode;

    if (isNotFound) {
      return (
        <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center min-h-[60vh]">
          <div
            className={cn(
              "p-8 sm:p-12 w-full max-w-sm rounded-[2rem] border border-dashed flex flex-col items-center justify-center text-center gap-4 transition-colors",
              "theme-panel",
            )}
          >
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-2", "bg-black/5 dark:bg-white/5")}>
              <SearchX size={28} className={"theme-text-faint"} />
            </div>
            
            <h2 className={cn("text-lg sm:text-xl font-black uppercase tracking-widest", "theme-text-base")}>
              {type === "player"
                ? "Player Not Found"
                : type === "course"
                  ? "Course Not Found"
                  : type === "setter"
                    ? "Setter Not Found"
                    : "Entity Not Found"}
            </h2>
            <p
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest opacity-50 px-2 line-clamp-2",
                "theme-text-muted",
              )}
            >
              ID: {requestedId}
            </p>
          </div>
        </div>
      );
    }

    let content: React.ReactNode;
    switch (type) {
      case "player":
        content = (
          <PlayerDetails
            player={finalData}
            dataContext={dataContext}
            onEntityClick={onEntityClick}
            theme={theme}
            initialTab="runs"
          />
        );
        break;
      case "setter":
        content = (
          <PlayerDetails
            player={finalData}
            dataContext={dataContext}
            onEntityClick={onEntityClick}
            theme={theme}
            initialTab="sets"
          />
        );
        break;
      case "course":
        content = (
          <CourseDetails
            course={finalData}
            dataContext={dataContext}
            onEntityClick={onEntityClick}
            theme={theme}
          />
        );
        break;
      case "team":
        content = (
          <TeamDetails
            team={finalData}
            dataContext={dataContext}
            onEntityClick={onEntityClick}
            theme={theme}
            initialMode={finalMode}
          />
        );
        break;
      case "region":
        content = (
          <RegionDetails
            region={finalData}
            dataContext={dataContext}
            onEntityClick={onEntityClick}
            theme={theme}
          />
        );
        break;
      case "info":
        content = (
          <div className="p-10 text-center flex flex-col gap-4 items-center justify-center min-h-[50vh]">
            <h2 className="text-2xl font-black uppercase tracking-widest">
              {finalData?.name || "INFORMATION"}
            </h2>
            <p
              className={cn(
                "max-w-md mx-auto text-sm opacity-60",
                "theme-text-base",
              )}
            >
              Detailed information will be available soon.
            </p>
          </div>
        );
        break;
      default:
        content = (
          <div className="p-10 flex flex-col items-center justify-center min-h-[50vh]">
            <div
              className={cn(
                "p-8 sm:p-12 w-full max-w-sm rounded-[2rem] border border-dashed flex flex-col items-center justify-center text-center gap-4 transition-colors",
                "theme-panel",
              )}
            >
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-2", "bg-black/5 dark:bg-white/5")}>
                <AlertCircle size={28} className={"theme-text-faint"} />
              </div>
              <h2 className={cn("text-lg sm:text-xl font-black uppercase tracking-widest", "theme-text-base")}>
                NO DATA FOUND
              </h2>
            </div>
          </div>
        );
        break;
    }

    const needsHeader = ["player", "setter", "course", "team", "region"].includes(type);

    return (
      <React.Suspense fallback={<DetailsSkeleton />}>
        {needsHeader && (
          <ASRProfileHeader 
            type={type} 
            data={finalData} 
            theme={theme} 
            pRaw={pRaw} 
          />
        )}
        {content}
      </React.Suspense>
    );
  },
);
