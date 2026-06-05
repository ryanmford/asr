import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Zap,
  Compass,
  Users,
  Ruler,
  Mountain,
  Dna,
  Calendar,
  MapPin,
  Play,
  Eye,
} from "lucide-react";
import {
  cn,
  formatLocation,
  THEME,
  getCombinedFlags,
  normalizeName,
  getSetterLevel,
} from "../../lib/asr-utils";
import { useAppStore } from "../../store/useAppStore";
import { ProfileHeader, ASRPatronPill, SectionTitle, InspectorTabContainer } from "./InspectorComponents";
import { FallbackAvatar } from "../common/FallbackAvatar";
import { ASRPromotionBanner } from "../common/ASRPromotionBanner";
import { ASRRankList } from "../list/ASRRankList";
import { ASRStandardButton } from "../common/ASRStandardButton";
import { CourseChampions } from "./CourseChampions";
import { ASRStatCard } from "../common/ASRStatCard";
import { ASRWeeklyActivityChart } from "./ASRWeeklyActivityChart";
import { ASRTimeSimulator } from "./ASRTimeSimulator";

import { motion } from "motion/react";

import { ASRNeonToggle } from "../common/ASRNeonToggle";

import { CourseData, ASRDataContext } from "../../types";

interface CourseDetailsProps {
  course: CourseData;
  dataContext: ASRDataContext;
  onEntityClick: (type: string, data: Record<string, unknown>) => void;
  theme: "light" | "dark";
}

const SetterDisplay = ({
  text,
  dataContext,
  onSetterClick,
  theme,
  isLead,
}: {
  text: string;
  dataContext: ASRDataContext;
  onSetterClick?: (type: string, data: Record<string, unknown>) => void;
  theme: "light" | "dark";
  isLead?: boolean;
}) => {
  if (!text) return null;
  const rawNames = text.split(",").map((s: string) => s.trim());
  
  const names = [...rawNames].sort((a, b) => {
    const aKey = normalizeName(a);
    const bKey = normalizeName(b);
    
    const aImpact = dataContext?.setterMet?.[aKey]?.impact || 0;
    const bImpact = dataContext?.setterMet?.[bKey]?.impact || 0;
    
    const aSets = dataContext?.setterMet?.[aKey]?.sets || 0;
    const bSets = dataContext?.setterMet?.[bKey]?.sets || 0;
    
    const aLevel = Number(getSetterLevel(aImpact, aSets) || 0);
    const bLevel = Number(getSetterLevel(bImpact, bSets) || 0);
    
    if (aLevel !== bLevel) return bLevel - aLevel;
    return bImpact - aImpact;
  });

  return (
    <div className="flex flex-col gap-3 mt-1 relative w-full">
      {/* timeline line */}
      <div
        className={cn(
          "absolute left-[25px] top-4 bottom-4 w-[2px]",
          "bg-black/10 dark:bg-white/10",
        )}
      />
      {names.map((name: string, i: number) => {
        const pKey = normalizeName(name);
        const pImpact = dataContext?.setterMet?.[pKey]?.impact || 0;
        const pSets = dataContext?.setterMet?.[pKey]?.sets || 0;
        const certLevel = getSetterLevel(pImpact, pSets);
        const hasBadge = !!certLevel;

        return (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onSetterClick?.("setter", { name });
            }}
            className={cn(
              "group flex flex-col relative pl-[52px] pr-5 py-3.5 rounded-[1.25rem] border transition-all text-left w-full outline-none hover:scale-[1.02] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              "theme-focus",
              theme === "dark"
                ? "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800"
                : "bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm",
            )}
          >
            <div
              className={cn(
                "absolute left-[8px] top-1/2 -translate-y-1/2 w-[34px] h-[34px] rounded-full border-[3px] flex items-center justify-center transition-colors",
                theme === "dark"
                  ? "bg-[#050505] border-[#050505] group-hover:bg-zinc-800 group-hover:border-zinc-800"
                  : "bg-white border-white group-hover:bg-zinc-50 group-hover:border-zinc-50",
                theme === "dark" ? "text-zinc-200" : "text-zinc-800",
              )}
            >
              <Eye size={14} className={cn(isLead ? "opacity-90" : "opacity-60")} />
            </div>
            <div className="flex justify-between items-center w-full min-w-0 gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-black text-sm uppercase tracking-tight truncate",
                    theme === "dark"
                      ? "text-zinc-200 group-hover:text-white"
                      : "text-zinc-800 group-hover:text-black",
                  )}
                >
                  {name}
                </span>
                {hasBadge && (
                  <span className="inline-flex items-center justify-center bg-red-600 text-white rounded-[4px] px-1.5 py-[1px] min-w-[20px] shadow-[0_0_8px_rgba(220,38,38,0.3)] leading-none border border-red-500/50 font-black text-[10px]">
                    {certLevel}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export const CourseDetails = React.memo(
  ({ course, dataContext, onEntityClick, theme }: CourseDetailsProps) => {
    const {
      cMet = {},
      atMet = {},
      pRaw = {},
      courseRunsHistory = {},
    } = dataContext || {};
    const setPlayingVideoUrl = useAppStore(s => s.setPlayingVideoUrl);
    const cName = (course?.name || "").toUpperCase();
    const meta = cMet[cName] || course || {};

    const allCourseRuns = useMemo(() => {
      let runList: Record<string, unknown>[] = [];
      if (courseRunsHistory[cName]) {
        runList = courseRunsHistory[cName].map((r: Record<string, unknown>) => ({
          ...r,
          athlete: atMet[r.pKey]?.name || r.athlete || r.pKey,
          gender: atMet[r.pKey]?.gender || r.gender || "M",
          country:
            atMet[r.pKey]?.countryName || atMet[r.pKey]?.country || r.country,
          flag: atMet[r.pKey]?.region || atMet[r.pKey]?.flag || r.flag,
        }));
      } else {
        const allTimePlayers = pRaw["all-time"] || {};
        Object.entries(allTimePlayers).forEach(
          ([pKey, playerRuns]: [string, unknown]) => {
            if (Array.isArray(playerRuns)) {
              const filtered = playerRuns.filter(
                (r) => (r.course || r.label || "").toUpperCase() === cName,
              );
              filtered.forEach((r) => {
                runList.push({
                  ...r,
                  pKey,
                  athlete: atMet[pKey]?.name || pKey,
                  gender: atMet[pKey]?.gender || "M",
                  country: atMet[pKey]?.countryName || atMet[pKey]?.country,
                  flag: atMet[pKey]?.region || atMet[pKey]?.flag,
                });
              });
            }
          },
        );
      }
      
      const mInterims = (dataContext.courseRecords_M_AT?.[cName] || []).filter((r: any) => r.isInterim);
      mInterims.forEach((r: any) => {
        runList.push({ ...r, athlete: "INTERIM TOP TIME", date: "2026-03-01T00:00:00Z", gender: "M", num: r.time, isInterim: true });
      });
      const fInterims = (dataContext.courseRecords_F_AT?.[cName] || []).filter((r: any) => r.isInterim);
      fInterims.forEach((r: any) => {
        runList.push({ ...r, athlete: "INTERIM TOP TIME", date: "2026-03-01T00:00:00Z", gender: "F", num: r.time, isInterim: true });
      });

      return runList;
    }, [pRaw, cName, atMet, courseRunsHistory, dataContext.courseRecords_M_AT, dataContext.courseRecords_F_AT]);

    const [searchParams] = useSearchParams();
    const urlTab = searchParams.get("tab");
    const validTabs = ["stats", "men", "women"];
    
    const initialTabSafe = validTabs.includes(urlTab as string)
        ? (urlTab as "stats" | "men" | "women")
        : "stats";
    const [uiTab, setUiTab] = useState<string>(initialTabSafe);
    const [contentTab, setContentTab] = useState<string>(initialTabSafe);

    const initialModeSafe = (searchParams.get("mode") as "open" | "all-time") || "open";
    const [uiMode, setUiMode] = useState<"open" | "all-time">(initialModeSafe);
    const [contentMode, setContentMode] = useState<"open" | "all-time">(initialModeSafe);

    const recordsM = contentMode === "all-time" 
      ? (dataContext.courseRecords_M_AT?.[cName] || [])
      : (dataContext.courseRecords_M_OP?.[cName] || []);

    const recordsF = contentMode === "all-time" 
      ? (dataContext.courseRecords_F_AT?.[cName] || [])
      : (dataContext.courseRecords_F_OP?.[cName] || []);

    const atRecordsM = dataContext.courseRecords_M_AT?.[cName] || [];
    const atRecordsF = dataContext.courseRecords_F_AT?.[cName] || [];

    const stats = [
      {
        label: "CR (M)",
        value: (() => {
          const times = atRecordsM.map(r => r.time).filter(t => t > 0);
          return times.length > 0 ? Math.min(...times).toFixed(2) : "-";
        })(),
        icon: <Zap className="w-3.5 h-3.5" />,
      },
      {
        label: "CR (W)",
        value: (() => {
          const times = atRecordsF.map(r => r.time).filter(t => t > 0);
          return times.length > 0 ? Math.min(...times).toFixed(2) : "-";
        })(),
        icon: <Zap className="w-3.5 h-3.5" />,
      },
      {
        label: "Difficulty",
        value: meta.difficulty || "-",
        icon: <Compass className="w-3.5 h-3.5" />,
      },
      {
        label: "Players",
        value: String(
          atRecordsM.filter(r => !r.isInterim).length +
          atRecordsF.filter(r => !r.isInterim).length
        ),
        icon: <Users className="w-3.5 h-3.5" />,
      },
      {
        label: "Length",
        value: meta.length
          ? `${Math.round(parseFloat(meta.length) || 0)}m`
          : "-",
        icon: <Ruler className="w-3.5 h-3.5" />,
      },
      {
        label: "Elevation",
        value: meta.elevation
          ? `${(parseFloat(meta.elevation) || 0).toFixed(2)}m`
          : "-",
        icon: <Mountain className="w-3.5 h-3.5" />,
      },
      {
        label: "Type",
        value: meta.type || "Standard",
        icon: <Dna className="w-3.5 h-3.5" />,
      },
      {
        label: "Date",
        value: meta.dateSet || "-",
        icon: <Calendar className="w-3.5 h-3.5" />,
      },
    ];

    const mapsUrl = meta.coordinates
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meta.coordinates)}`
      : null;
    const rulesUrl = meta.demoVideo;

    return (
      <div
        className={cn(
          "flex flex-col relative pb-20 transition-colors",
          theme === "dark" ? "bg-[#030303]" : "bg-white",
        )}
      >
        <ProfileHeader
          theme={theme}
          avatar={<FallbackAvatar name={cName} sizeCls="text-3xl" />}
          title={
            <span className="flex items-center gap-2">
              <span className="shrink-0 leading-none">{getCombinedFlags(meta)}</span>
              <span className="truncate">{cName}</span>
            </span>
          }
          subtitle={
            <div className="flex items-center gap-1.5 opacity-60 font-black text-[11px] uppercase tracking-widest mt-1">
              <MapPin size={12} />
              <span className="truncate">{formatLocation(meta)}</span>
            </div>
          }
        />

        <div className="flex w-full gap-2 px-4 py-3 pt-4 border-b border-white/[0.05]">
          <ASRStandardButton
            href={mapsUrl || undefined}
            target="_blank"
            rel="noreferrer"
            variant="premium"
            color="blue"
            theme={theme}
            disabled={!mapsUrl}
            className="flex-1 py-2.5 px-0 justify-center rounded-xl text-[12px]"
            onClick={(e: React.MouseEvent) =>
              !mapsUrl && e.preventDefault()
            }
          >
            <MapPin size={16} strokeWidth={2.5} />
            <span>MAP</span>
          </ASRStandardButton>
          <ASRStandardButton
            href={rulesUrl || undefined}
            target="_blank"
            rel="noreferrer"
            variant="premium"
            color="red"
            theme={theme}
            disabled={!rulesUrl}
            className="flex-1 py-2.5 px-0 justify-center rounded-xl text-[12px]"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              if (rulesUrl) {
                setPlayingVideoUrl(rulesUrl);
              }
            }}
          >
            <Play size={16} strokeWidth={2.5} />
            <span>RULES</span>
          </ASRStandardButton>
        </div>

        <div className="w-full px-4 py-3 border-b border-white/[0.05]">
          <ASRPatronPill course={meta} theme={theme} isBanner={false} />
        </div>

        <div
          className={cn(
            "flex items-center justify-center border-b sticky top-0 z-40 backdrop-blur-3xl transition-colors py-2",
            theme === "dark"
              ? "border-white/5 bg-zinc-950/80 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
              : "border-black/5 bg-white/90 shadow-[0_4px_30px_rgba(0,0,0,0.03)]",
          )}
        >
          <div className="flex w-full max-w-2xl px-4">
            <ASRNeonToggle
              options={[
                { label: "MEN", value: "men" },
                { label: "WOMEN", value: "women" },
                { label: "BIO", value: "stats" },
              ]}
              activeOption={uiTab}
              onChange={(t) => {
                setUiTab(t);
                React.startTransition(() => {
                  setContentTab(t);
                });
              }}
              layoutId="course-tabs"
              theme={theme}
              className="w-full"
            />
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col flex-1 transition-colors",
            theme === "dark" ? "bg-[#030303]" : "bg-white",
          )}
        >
          {contentTab === "men" && (
            <div className="animate-in fade-in duration-300 flex flex-col h-full overflow-visible">
              <div
                className={cn(
                  "flex justify-center border-b transition-colors overflow-visible sticky top-[46px] z-30 py-3",
                  theme === "dark"
                    ? "border-white/[0.05] bg-zinc-950/80 backdrop-blur-xl"
                    : "border-black/[0.05] bg-white/90 backdrop-blur-xl",
                )}
              >
                <ASRNeonToggle
                  options={[
                    { label: "OPEN", value: "open" },
                    { label: "ALL-TIME", value: "all-time" },
                  ]}
                  activeOption={uiMode}
                  onChange={(m) => {
                    const nextMode = m as "open" | "all-time";
                    setUiMode(nextMode);
                    React.startTransition(() => {
                      setContentMode(nextMode);
                    });
                  }}
                  layoutId="course-mode-pill-m"
                  theme={theme}
                  className="w-full max-w-[280px]"
                />
              </div>
              <div className="px-4 py-6 overflow-visible min-h-[500px]">
                {contentMode === "open" && !meta.is2026 ? (
                  <div className="text-center text-zinc-500 py-10 px-4 text-sm max-w-sm mx-auto">
                    * Course not included in the 2026 ASR Open.
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <ASRTimeSimulator 
                      theme={theme}
                      courseRecord={atRecordsM.length > 0 ? Math.min(...atRecordsM.filter(r => r.time > 0).map(r => r.time)) : 0}
                      records={atRecordsM.filter(r => !r.isInterim)}
                      gender="M"
                      dataContext={dataContext}
                      cName={cName}
                    />
                    <ASRRankList
                      athletes={recordsM}
                      dataContext={dataContext}
                      onEntityClick={onEntityClick}
                      entityType="player"
                      hideSubtitle={true}
                      padTo={3}
                    />
                  </div>
                )}
              </div>
              <div className="pt-4 px-4 pb-8">
                <ASRPromotionBanner
                  type="sponsor"
                  theme={theme}
                  course={course}
                />
              </div>
            </div>
          )}

          {contentTab === "women" && (
            <div className="animate-in fade-in duration-300 flex flex-col h-full overflow-visible">
              <div
                className={cn(
                  "flex justify-center border-b transition-colors overflow-visible sticky top-[46px] z-30 py-3",
                  theme === "dark"
                    ? "border-white/[0.05] bg-zinc-950/80 backdrop-blur-xl"
                    : "border-black/[0.05] bg-white/90 backdrop-blur-xl",
                )}
              >
                <ASRNeonToggle
                  options={[
                    { label: "OPEN", value: "open" },
                    { label: "ALL-TIME", value: "all-time" },
                  ]}
                  activeOption={uiMode}
                  onChange={(m) => {
                    const nextMode = m as "open" | "all-time";
                    setUiMode(nextMode);
                    React.startTransition(() => {
                      setContentMode(nextMode);
                    });
                  }}
                  layoutId="course-mode-pill-f"
                  theme={theme}
                  className="w-full max-w-[280px]"
                />
              </div>
              <div className="px-4 py-6 overflow-visible min-h-[500px]">
                {contentMode === "open" && !meta.is2026 ? (
                  <div className="text-center text-zinc-500 py-10 px-4 text-sm max-w-sm mx-auto">
                    * Course not included in the 2026 ASR Open.
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <ASRTimeSimulator 
                      theme={theme}
                      courseRecord={atRecordsF.length > 0 ? Math.min(...atRecordsF.filter(r => r.time > 0).map(r => r.time)) : 0}
                      records={atRecordsF.filter(r => !r.isInterim)}
                      gender="F"
                      dataContext={dataContext}
                      cName={cName}
                    />
                    <ASRRankList
                      athletes={recordsF}
                      dataContext={dataContext}
                      onEntityClick={onEntityClick}
                      entityType="player"
                      hideSubtitle={true}
                      padTo={3}
                    />
                  </div>
                )}
              </div>
              <div className="pt-4 px-4 pb-8">
                <ASRPromotionBanner
                  type="sponsor"
                  theme={theme}
                  course={course}
                />
              </div>
            </div>
          )}

          {contentTab === "stats" && (
            <InspectorTabContainer tight>
              <div className="flex flex-col gap-4">
                <SectionTitle>STATS</SectionTitle>

                <div className="grid grid-cols-2 gap-2.5 overflow-visible">
                  {stats.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        delay: i * 0.05,
                        duration: 0.3
                      }}
                      className="flex"
                    >
                      <ASRStatCard label={s.label} value={s.value} />
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <SectionTitle>WEEKLY ACTIVITY</SectionTitle>
                <div className="px-2 pb-2">
                  <ASRWeeklyActivityChart runs={allCourseRuns} type="run" />
                </div>
              </div>

              {(meta.leadSetters || meta.assistantsetters || meta.setter) && (
                <div className="flex flex-col gap-4 text-left overflow-visible w-full">
                  <SectionTitle>SETTERS</SectionTitle>
                  <div
                    className={cn(
                      "flex flex-col gap-6 p-5 rounded-[2rem]",
                      THEME.BENTO_CARD(theme),
                    )}
                  >
                    {(meta.leadSetters || meta.setter) && (
                      <div className="flex flex-col gap-1">
                        <SectionTitle noPadding className="opacity-40">
                          LEADS
                        </SectionTitle>
                        <div
                          className={cn(
                            "text-[15px] font-black tabular-nums tracking-tighter",
                            "theme-text-base",
                          )}
                        >
                          <SetterDisplay
                            text={meta.leadSetters || meta.setter}
                            dataContext={dataContext}
                            onSetterClick={onEntityClick}
                            theme={theme}
                            isLead={true}
                          />
                        </div>
                      </div>
                    )}
                    {meta.assistantsetters && (
                      <div className="flex flex-col gap-1 mt-2">
                        <SectionTitle noPadding className="opacity-40">
                          ASSISTS
                        </SectionTitle>
                        <div
                          className={cn(
                            "text-[15px] font-black tabular-nums tracking-tighter",
                            "theme-text-base",
                          )}
                        >
                          <SetterDisplay
                            text={meta.assistantsetters}
                            dataContext={dataContext}
                            onSetterClick={onEntityClick}
                            theme={theme}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 text-left overflow-visible w-full">
                <SectionTitle>CHAMPIONS</SectionTitle>
                <CourseChampions runs={allCourseRuns} theme={theme} />
              </div>

              <div className="pt-4 pb-8">
                <ASRPromotionBanner
                  type="sponsor"
                  theme={theme}
                  course={course}
                />
              </div>
            </InspectorTabContainer>
          )}
        </div>
      </div>
    );
  },
);
