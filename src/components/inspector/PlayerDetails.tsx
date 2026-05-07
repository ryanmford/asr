import React, { useMemo, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ASRWeeklyActivityChart } from "../ui/ASRWeeklyActivityChart";
import {
  Video,
  Calendar,
  Instagram,
  ShieldAlert,
  Building2,
  Users,
  X,
} from "lucide-react";
import {
  cn,
  formatLocation,
  formatFlagsWithSpace,
  getSetterLevel,
} from "../../lib/asr-utils";
import { ASRStatCard } from "../ui/ASRStatCard";
import { BioStat, BioRow } from "../ui/BioComponents";
import { ASRNeonToggle } from "../ui/ASRNeonToggle";
import { FallbackAvatar } from "../ui/FallbackAvatar";
import {
  ProfileHeader,
  SupportLink,
  SectionTitle,
  InspectorTabContainer,
} from "./InspectorComponents";
import { TokenChip, TrophyStand, FlatCard } from "./VaultComponents";
import { ASRPromotionBanner, PromoType } from "../ui/ASRPromotionBanner";
import {
  InteractiveCard,
  InteractiveTrophy,
  InteractiveToken,
  InteractiveMedal,
} from "../ui/InteractiveCollectibles";
import { ASRRankList } from "../list/ASRRankList";

import { PlayerProfile, ASRDataContext } from "../../types";
import { usePlayerDetailsData } from "../../hooks/useInspectorFormatting";

interface PlayerDetailsProps {
  player: PlayerProfile & Record<string, unknown>;
  dataContext: ASRDataContext;
  onEntityClick: (type: string, data: Record<string, unknown>) => void;
  theme: "light" | "dark";
  initialTab?: string;
}

export const PlayerDetails = React.memo(
  ({
    player,
    dataContext,
    onEntityClick,
    theme,
    initialTab = "runs",
  }: PlayerDetailsProps) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();

    const urlTab = searchParams.get("tab");
    const validTabs = ["runs", "sets", "vault", "bio"];
    const activeTab = validTabs.includes(urlTab as string)
      ? urlTab
      : initialTab || "runs";
    const setActiveTab = React.useCallback(
      (t: string) => {
        setSearchParams(
          (prev) => {
            prev.set("tab", t);
            return prev;
          },
          { replace: true, state: location.state },
        );
      },
      [setSearchParams, location.state],
    );

    const activeMode =
      (searchParams.get("mode") as "open" | "all-time") || "open";
    const setActiveMode = React.useCallback(
      (m: "open" | "all-time") => {
        setSearchParams(
          (prev) => {
            prev.set("mode", m);
            return prev;
          },
          { replace: true, state: location.state },
        );
      },
      [setSearchParams, location.state],
    );

    const [selectedItem, setSelectedItem] = useState<{ type: string; item: unknown } | null>(null);

    const randomRunsPromo = useMemo(() => {
      const types: PromoType[] = ["coach"];
      return types[Math.floor(Math.random() * types.length)];
    }, []);

    const {
      meta,
      stats,
      avgTime,
      allRuns,
      setterInfo,
      coursesSet,
      rankListSets,
      mappedSetsChartData,
      calculatedAvgLength,
      vitals,
      rankListRuns,
      vaultItems,
    } = usePlayerDetailsData(player, activeMode, dataContext);

    return (
      <div
        className={cn(
          "flex flex-col relative pb-32 transition-colors",
          theme === "dark" ? "bg-[#030303]" : "bg-white",
        )}
      >
        <ProfileHeader
          theme={theme}
          avatar={<FallbackAvatar name={meta.name} sizeCls="text-3xl" />}
          title={
            <span className="flex items-center gap-2">
              <span className="drop-shadow-xl shrink-0 text-xl whitespace-nowrap">
                {formatFlagsWithSpace(meta.flag || meta.region)}
              </span>
              <span className="truncate">{meta.name}</span>
            </span>
          }
          subtitle={formatLocation(meta)}
        />

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
                { label: "RUNS", value: "runs" },
                { label: "SETS", value: "sets" },
              ]}
              activeOption={activeTab}
              onChange={(t) => setActiveTab(t)}
              layoutId="profile-tabs"
              theme={theme}
              className="w-full"
            />
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col flex-1 transition-colors",
            theme === "dark" ? "bg-[#050505]" : "bg-[#FAFAFA]",
          )}
        >
          {activeTab === "runs" && (
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
                  activeOption={activeMode}
                  onChange={(m) => setActiveMode(m as "open" | "all-time")}
                  layoutId="player-mode-pill"
                  theme={theme}
                  className="w-full max-w-[280px]"
                />
              </div>

              <div
                className={cn(
                  "flex flex-col border-b transition-colors overflow-visible",
                  theme === "dark"
                    ? "border-white/[0.05]"
                    : "border-black/[0.05]",
                )}
              >
                <div className="grid grid-cols-2 gap-2.5 px-4 py-6 overflow-visible">
                  {[
                    {
                      label: "RANK",
                      value: stats.rank,
                      glow: stats.rank <= 3 ? "text-amber-500" : "",
                    },
                    { label: "LQ", value: stats.rating.toFixed(2) },
                    { label: "POINTS", value: stats.pts.toFixed(2) },
                    { label: "RUNS", value: stats.runs },
                    { label: "WINS", value: stats.wins },
                    {
                      label: "WIN %",
                      value:
                        stats.runs > 0
                          ? `${((stats.wins / stats.runs) * 100).toFixed(2)}`
                          : "0.00",
                    },
                    { label: "AVG TIME", value: avgTime },
                    { label: "🔥", value: stats.fires },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      className="flex"
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        delay: i * 0.05,
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <ASRStatCard
                        label={s.label}
                        value={s.value}
                        glowClass={s.glow}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-2">
                <ASRWeeklyActivityChart runs={allRuns} />
              </div>

              <div className="p-6 flex flex-col gap-6 pt-6 relative min-h-[300px]">
                <SectionTitle>VERIFIED RUNS</SectionTitle>
                {rankListRuns.length > 0 ? (
                  <ASRRankList
                    athletes={rankListRuns}
                    valueLabel="PTS"
                    onEntityClick={onEntityClick}
                    limit={100}
                    dataContext={dataContext}
                    hideSubtitle={true}
                    entityType="course"
                  />
                ) : (
                  <div className={cn(
                    "flex flex-col items-center justify-center py-16 text-center rounded-[32px] border relative overflow-hidden",
                    theme === "dark" ? "bg-zinc-900/40 border-zinc-800" : "bg-slate-50 border-slate-200"
                  )}>
                    <div className={cn(
                      "absolute inset-0 opacity-[0.02] pointer-events-none",
                      theme === "dark" 
                        ? "bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:16px_16px]" 
                        : "bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] [background-size:16px_16px]"
                    )} />
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center mb-4 relative z-10",
                      theme === "dark" ? "bg-zinc-800/80 shadow-[0_0_30px_rgba(255,255,255,0.05)] text-zinc-400" : "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-slate-400"
                    )}>
                      <ShieldAlert size={28} strokeWidth={1.5} />
                    </div>
                    <h4 className={cn("text-base font-black tracking-widest uppercase mb-2 relative z-10", theme === "dark" ? "text-zinc-300" : "text-zinc-600")}>
                      NO VERIFIED RUNS
                    </h4>
                    <p className={cn("text-xs font-medium tracking-wide max-w-[240px] leading-relaxed relative z-10", theme === "dark" ? "text-zinc-500" : "text-slate-500")}>
                      THIS ATHLETE HAS NOT LOGGED ANY OFFICIAL RUNS IN THIS DIVISION.
                    </p>
                  </div>
                )}
                <div className="pt-8 relative z-10">
                  <ASRPromotionBanner type={randomRunsPromo} theme={theme} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "sets" && (
            <div className="animate-in fade-in duration-300 flex flex-col h-full overflow-visible">
              <div
                className={cn(
                  "flex flex-col border-b transition-colors overflow-visible",
                  theme === "dark"
                    ? "border-white/[0.05] bg-zinc-950/50"
                    : "border-black/[0.05] bg-white",
                )}
              >
                <div className="grid grid-cols-2 gap-3 px-4 py-6 overflow-visible">
                  {[
                    (() => {
                      const computedLevel = getSetterLevel(setterInfo?.impact || 0, setterInfo?.sets || 0);
                      return { 
                        label: "LEVEL", 
                        value: computedLevel ? (
                          <span className="inline-flex items-center justify-center bg-red-600 text-white rounded-[4px] px-1.5 py-0.5 min-w-[24px] shadow-[0_0_8px_rgba(220,38,38,0.3)] leading-none border border-red-500/50">
                            {computedLevel}
                          </span>
                        ) : "-"
                      };
                    })(),
                    {
                      label: "IMPACT",
                      value: Math.round(setterInfo?.impact || 0),
                    },
                    { label: "SETS", value: coursesSet.length },
                    {
                      label: "LEADS",
                      value:
                        setterInfo?.leads ||
                        coursesSet.filter((c) => c.role === "LEAD").length,
                    },
                    {
                      label: "ASSISTS",
                      value:
                        setterInfo?.assists ||
                        coursesSet.filter((c) => c.role === "ASSIST").length,
                    },
                    { label: "FILMS", value: meta.films || 0 },
                    {
                      label: "AVG LEN",
                      value: `${calculatedAvgLength.toFixed(0)}m`,
                    },
                    {
                      label: "🪙",
                      value: (meta.contributionScore || 0).toFixed(2),
                    },
                  ].map((s) => (
                    <div key={s.label} className="flex">
                      <ASRStatCard label={s.label} value={s.value} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-2">
                <ASRWeeklyActivityChart runs={mappedSetsChartData} type="set" />
              </div>

              <div className="p-6 flex flex-col gap-6 pt-6 relative min-h-[300px]">
                <SectionTitle>VERIFIED SETS</SectionTitle>
                {rankListSets.length > 0 ? (
                  <ASRRankList
                    athletes={rankListSets}
                    valueLabel="RUNS"
                    onEntityClick={onEntityClick}
                    limit={100}
                    dataContext={dataContext}
                    hideSubtitle={true}
                    entityType="course"
                  />
                ) : (
                  <div className={cn(
                    "flex flex-col items-center justify-center py-16 text-center rounded-[32px] border relative overflow-hidden",
                    theme === "dark" ? "bg-zinc-900/40 border-zinc-800" : "bg-slate-50 border-slate-200"
                  )}>
                    <div className={cn(
                      "absolute inset-0 opacity-[0.02] pointer-events-none",
                      theme === "dark" 
                        ? "bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:16px_16px]" 
                        : "bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] [background-size:16px_16px]"
                    )} />
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center mb-4 relative z-10",
                      theme === "dark" ? "bg-zinc-800/80 shadow-[0_0_30px_rgba(255,255,255,0.05)] text-zinc-400" : "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-slate-400"
                    )}>
                      <ShieldAlert size={28} strokeWidth={1.5} />
                    </div>
                    <h4 className={cn("text-base font-black tracking-widest uppercase mb-2 relative z-10", theme === "dark" ? "text-zinc-300" : "text-zinc-600")}>
                      NO VERIFIED SETS
                    </h4>
                    <p className={cn("text-xs font-medium tracking-wide max-w-[240px] leading-relaxed relative z-10", theme === "dark" ? "text-zinc-500" : "text-slate-500")}>
                      THIS ATHLETE HAS NOT SET ANY OFFICIAL COURSES YET.
                    </p>
                  </div>
                )}
                <div className="pt-8 relative z-10">
                  <ASRPromotionBanner type="setter" theme={theme} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "vault" && (
            <InspectorTabContainer className="gap-14 text-center">
              <div className="flex flex-col gap-8">
                <SectionTitle noPadding>TOKENS</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <TokenChip
                    theme={theme}
                    token={{
                      id: "gold",
                      title: "GOLD",
                      count: vaultItems.podium.gold,
                      icon: "🥇",
                    }}
                    onClick={() => vaultItems.podium.gold > 0 && setSelectedItem({ type: "medal", item: { id: "gold", title: "GOLD", count: vaultItems.podium.gold, icon: "🥇" } })}
                  />
                  <TokenChip
                    theme={theme}
                    token={{
                      id: "silver",
                      title: "SILVER",
                      count: vaultItems.podium.silver,
                      icon: "🥈",
                    }}
                    onClick={() => vaultItems.podium.silver > 0 && setSelectedItem({ type: "medal", item: { id: "silver", title: "SILVER", count: vaultItems.podium.silver, icon: "🥈" } })}
                  />
                  <TokenChip
                    theme={theme}
                    token={{
                      id: "bronze",
                      title: "BRONZE",
                      count: vaultItems.podium.bronze,
                      icon: "🥉",
                    }}
                    onClick={() => vaultItems.podium.bronze > 0 && setSelectedItem({ type: "medal", item: { id: "bronze", title: "BRONZE", count: vaultItems.podium.bronze, icon: "🥉" } })}
                  />
                  {vaultItems.tokens.map((token) => (
                    <TokenChip
                      key={token.id}
                      theme={theme}
                      token={token}
                      onClick={() =>
                        token.count > 0 &&
                        setSelectedItem({ type: "token", item: token })
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-5 items-center">
                <SectionTitle noPadding>TROPHIES</SectionTitle>
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6">
                  {vaultItems.trophies.map((trophy) => (
                    <TrophyStand
                      key={trophy.id}
                      trophy={trophy}
                      theme={theme}
                      onClick={() =>
                        setSelectedItem({ type: "trophy", item: trophy })
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <SectionTitle noPadding>CARDS</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vaultItems.cards.map((card) => (
                    <FlatCard
                      key={card.id}
                      card={card}
                      theme={theme}
                      onClick={() =>
                        setSelectedItem({ type: "card", item: card })
                      }
                    />
                  ))}
                </div>
              </div>
            </InspectorTabContainer>
          )}

          {activeTab === "bio" && (
            <InspectorTabContainer>
              <div className="flex flex-col gap-4">
                <SectionTitle>SEND TIP</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SupportLink
                    provider="Venmo"
                    handle={`@${(meta?.name || "").toLowerCase().replace(" ", "_")}`}
                    color="bg-[#008CFF]/10 text-[#008CFF] border-[#008CFF]/20 hover:bg-[#008CFF]/20"
                  />
                  <SupportLink
                    provider="ENS"
                    handle={`${(meta?.name || "").split(" ")[0].toLowerCase()}.eth`}
                    color="bg-[#8C52FF]/10 text-[#8C52FF] border-[#8C52FF]/20 hover:bg-[#8C52FF]/20"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <SectionTitle>GYMS & TEAMS</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {meta.homeGym && meta.homeGym !== "UNAFFILIATED" && (
                    <BioRow
                      theme={theme}
                      icon={<Building2 size={18} />}
                      label="HOME GYM"
                      value={meta.homeGym}
                    />
                  )}
                  {meta.teams && meta.teams.length > 0
                    ? meta.teams.map((t: Record<string, unknown> | string, i: number) => (
                        <BioRow
                          key={i}
                          theme={theme}
                          icon={<Users size={18} />}
                          label={
                            meta.teams.length > 1 ? `TEAM ${i + 1}` : "TEAM"
                          }
                          value={typeof t === "string" ? t : t?.name}
                        />
                      ))
                    : (!meta.homeGym || meta.homeGym === "UNAFFILIATED") && (
                        <BioRow
                          theme={theme}
                          icon={<ShieldAlert size={18} />}
                          label="STATUS"
                          value="UNAFFILIATED"
                        />
                      )}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <SectionTitle>SPECIFICATIONS</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <BioStat theme={theme} label="HEIGHT" value={vitals.height} />
                  <BioStat theme={theme} label="WEIGHT" value={vitals.weight} />
                  <BioStat
                    theme={theme}
                    label="WINGSPAN"
                    value={vitals.wingspan}
                  />
                  <BioStat
                    theme={theme}
                    label="APE INDEX"
                    value={vitals.apeIndex}
                  />
                  <BioStat
                    theme={theme}
                    label="EQUIPMENT"
                    value={vitals.shoe}
                  />
                  <BioStat
                    theme={theme}
                    label="SHOE SIZE"
                    value={vitals.shoeSize}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <SectionTitle>DIGITAL FOOTPRINT</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <BioRow
                    theme={theme}
                    icon={<Instagram size={18} />}
                    label="INSTAGRAM"
                    value={meta.igHandle || meta.ig || "NOT LINKED"}
                    isLink={!!(meta.igHandle || meta.ig)}
                    igHandle={meta.igHandle || meta.ig}
                  />
                  <BioRow
                    theme={theme}
                    icon={<Video size={18} />}
                    label="YOUTUBE"
                    value={meta.name?.split(" ")[0] + " Parkour"}
                  />
                  <BioRow
                    theme={theme}
                    icon={<Calendar size={18} />}
                    label="MEMBER SINCE"
                    value="MARCH 2024"
                  />
                </div>
              </div>
            </InspectorTabContainer>
          )}
        </div>

        {/* Interactive Modal */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "fixed inset-0 z-[130] flex items-center justify-center p-4 backdrop-blur-xl",
                theme === "dark" ? "bg-black/90" : "bg-white/80"
              )}
            >
              <div
                className="absolute inset-0"
                onClick={() => setSelectedItem(null)}
              />
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative z-10 flex flex-col items-center w-full max-w-sm"
              >
                <button
                  onClick={() => setSelectedItem(null)}
                  className={cn(
                    "absolute -top-12 right-0 p-2 rounded-full transition-all active:scale-95 outline-none focus-visible:ring-2",
                    theme === "dark" 
                      ? "bg-white/10 hover:bg-white/20 text-white focus-visible:ring-white" 
                      : "bg-black/10 hover:bg-black/20 text-black focus-visible:ring-black"
                  )}
                >
                  <X size={24} />
                </button>

                {selectedItem.type === "card" && (
                  <InteractiveCard card={selectedItem.item} player={meta} theme={theme} />
                )}
                {selectedItem.type === "trophy" && (
                  <InteractiveTrophy trophy={selectedItem.item} player={meta} theme={theme} />
                )}
                {selectedItem.type === "token" && (
                  <InteractiveToken token={selectedItem.item} player={meta} theme={theme} />
                )}
                {selectedItem.type === "medal" && (
                  <InteractiveMedal medal={selectedItem.item} player={meta} theme={theme} />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
