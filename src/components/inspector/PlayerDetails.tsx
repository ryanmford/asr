import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ASRWeeklyActivityChart } from "./ASRWeeklyActivityChart";
import {
  Calendar,
  Instagram,
  ShieldAlert,
  Building2,
  Users,
  X,
  MapPin,
} from "lucide-react";
import {
  cn,
  formatLocation,
  getCombinedFlags,
  getSetterLevel,
} from "../../lib/asr-utils";
import { ASRStatCard } from "../common/ASRStatCard";
import { BioRow } from "./BioComponents";
import { ASRNeonToggle } from "../common/ASRNeonToggle";
import { FallbackAvatar } from "../common/FallbackAvatar";
import {
  ProfileHeader,
  SectionTitle,
  InspectorTabContainer,
} from "./InspectorComponents";
import { TokenChip, TrophyStand, FlatCard } from "./VaultComponents";
import { ASRPromotionBanner, PromoType } from "../common/ASRPromotionBanner";
import {
  InteractiveCard,
  InteractiveTrophy,
  InteractiveToken,
  InteractiveMedal,
} from "./InteractiveCollectibles";
import { ASRRankList } from "../list/ASRRankList";

import { ASREmptyState } from "../common/ASREmptyState";

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
    const [searchParams] = useSearchParams();

    const urlTab = searchParams.get("tab");
    const validTabs = ["runs", "sets", "vault", "bio"];
    
    // Use local state so modal updates don't trigger global tree re-renders
    const initialTabSafe = validTabs.includes(urlTab as string) ? (urlTab as string) : initialTab || "runs";
    const [uiTab, setUiTab] = useState<string>(initialTabSafe);
    const [contentTab, setContentTab] = useState<string>(initialTabSafe);

    const initialModeSafe = (searchParams.get("mode") as "open" | "all-time") || "open";
    const [uiMode, setUiMode] = useState<"open" | "all-time">(initialModeSafe);
    const [contentMode, setContentMode] = useState<"open" | "all-time">(initialModeSafe);

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
    } = usePlayerDetailsData(player, contentMode, dataContext);

    const assignedShoe = useMemo(() => {
      const rawShoe = vitals.shoe;
      const hasShoe = rawShoe && rawShoe !== "-";
      
      if (hasShoe) {
        return {
          model: rawShoe,
          hasDetails: true
        };
      }

      return {
        model: "SHOES UNKNOWN",
        hasDetails: false
      };
    }, [vitals.shoe]);

    const affiliateLink = useMemo(() => {
      const modelLower = (assignedShoe.model || "").toLowerCase();
      if (modelLower.includes("strike movement") || modelLower.includes("strike mvmnt")) {
        return "https://strike-mvmnt.com/";
      }
      return `https://www.amazon.com/s?k=${encodeURIComponent(assignedShoe.model)}&tag=apexspeedrun-20`;
    }, [assignedShoe.model]);

    const memberSince = useMemo(() => {
      const dates: Date[] = [];
      allRuns.forEach((r: Record<string, unknown>) => {
        if (r.date) {
          const d = new Date(r.date as string);
          if (!isNaN(d.getTime())) {
            dates.push(d);
          }
        }
      });
      rankListSets.forEach((s: Record<string, unknown>) => {
        const dateVal = (s.dateSet || s.date) as string | undefined;
        if (dateVal) {
          const d = new Date(dateVal);
          if (!isNaN(d.getTime())) {
            dates.push(d);
          }
        }
      });

      if (dates.length === 0) {
        return "MARCH 2024"; // fallback for default members
      }

      dates.sort((a, b) => a.getTime() - b.getTime());
      const earliestDate = dates[0];
      const months = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
      ];
      return `${months[earliestDate.getMonth()]} ${earliestDate.getFullYear()}`;
    }, [allRuns, rankListSets]);

    return (
      <div
        className={cn(
          "flex flex-col relative pb-32 transition-colors",
          theme === "dark" ? "bg-[#030303]" : "bg-white",
        )}
      >
        <ProfileHeader
          theme={theme}
          avatar={<FallbackAvatar name={meta?.name || player.name} sizeCls="text-3xl" />}
          title={
            <span className="flex items-center gap-2">
              <span className="shrink-0 leading-none">{getCombinedFlags(meta || player)}</span>
              <span className="truncate">{meta?.name || player.name}</span>
            </span>
          }
          subtitle={
            <div className="flex items-center gap-1.5 opacity-60 font-black text-[11px] uppercase tracking-widest mt-1">
              <MapPin size={12} />
              <span className="truncate">{formatLocation(meta || player)}</span>
            </div>
          }
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
                { label: "BIO", value: "bio" },
              ]}
              activeOption={uiTab}
              onChange={(t) => {
                setUiTab(t);
                React.startTransition(() => {
                  setContentTab(t);
                });
              }}
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
          {contentTab === "runs" && (
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
                        duration: 0.3
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

              {contentMode === "all-time" && (
                <div className="px-6 pb-2">
                  <ASRWeeklyActivityChart runs={allRuns} />
                </div>
              )}

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
                  <ASREmptyState 
                    theme={theme}
                    title="NO VERIFIED RUNS"
                    message="THIS PLAYER HAS NOT LOGGED ANY OFFICIAL RUNS IN THIS DIVISION."
                  />
                )}
                <div className="pt-8 relative z-10">
                  <ASRPromotionBanner type={randomRunsPromo} theme={theme} />
                </div>
              </div>
            </div>
          )}

          {contentTab === "sets" && (
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
                      value: setterInfo?.impact || 0,
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
                  <ASREmptyState 
                    theme={theme}
                    title="NO VERIFIED SETS"
                    message="THIS PLAYER HAS NOT SET ANY OFFICIAL COURSES YET."
                  />
                )}
                <div className="pt-8 relative z-10">
                  <ASRPromotionBanner type="setter" theme={theme} />
                </div>
              </div>
            </div>
          )}

          {contentTab === "vault" && (
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

          {contentTab === "bio" && (
            <InspectorTabContainer>
              {/* Profile Channels / Networks */}
              {meta.igHandle ? (
                <div className="flex flex-col gap-4">
                  <SectionTitle>SOCIALS</SectionTitle>
                  <div className="grid grid-cols-1 gap-4">
                    <BioRow
                      theme={theme}
                      icon={<Instagram size={18} />}
                      label="INSTAGRAM"
                      value={`@${meta.igHandle}`}
                      href={`https://instagram.com/${meta.igHandle}`}
                    />
                  </div>
                </div>
              ) : null}

              {/* Gym and team affiliations (AFFILIATIONS) */}
              <div className="flex flex-col gap-4">
                <SectionTitle>AFFILIATIONS</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {meta.homeGym && meta.homeGym !== "UNAFFILIATED" && (
                    <BioRow
                      theme={theme}
                      icon={<Building2 size={18} />}
                      label="GYM"
                      value={String(meta.homeGym)}
                      onClick={() => onEntityClick("team", { name: String(meta.homeGym) })}
                    />
                  )}
                  {meta.teams && meta.teams.length > 0
                    ? meta.teams.map((t: Record<string, unknown> | string, i: number) => {
                        const teamName = typeof t === "string" ? t : t?.name;
                        return (
                          <BioRow
                            key={i}
                            theme={theme}
                            icon={<Users size={18} />}
                            label={meta.teams && meta.teams.length > 1 ? `TEAM ${i + 1}` : "TEAM"}
                            value={String(teamName)}
                            onClick={() => onEntityClick("team", { name: String(teamName) })}
                          />
                        );
                      })
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

              {/* Official Footwear Spec Section */}
              <div className="flex flex-col gap-4">
                <SectionTitle>FOOTWEAR</SectionTitle>
                {assignedShoe.hasDetails ? (
                  <a
                    href={affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "p-[1.5rem] rounded-[1.5rem] border relative overflow-hidden transition-all flex flex-col justify-center shadow-sm group hover:scale-[1.01] duration-300 pointer-events-auto",
                      theme === "dark"
                        ? "bg-zinc-950/40 border-white/5 hover:border-white/10 hover:bg-zinc-950/60"
                        : "bg-zinc-50/60 border-black/5 hover:border-black/10 hover:bg-zinc-50/80"
                    )}
                  >
                    <span className={cn(
                      "text-base font-black uppercase tracking-tight truncate group-hover:text-blue-500 transition-colors",
                      theme === "dark" ? "text-white" : "text-zinc-900"
                    )}>
                      {assignedShoe.model}
                    </span>
                  </a>
                ) : (
                  <div
                    className={cn(
                      "p-[1.5rem] rounded-[1.5rem] border relative overflow-hidden flex flex-col justify-center shadow-sm",
                      theme === "dark"
                        ? "bg-zinc-950/10 border-white/5"
                        : "bg-zinc-50/20 border-black/5"
                    )}
                  >
                    <span className="text-sm font-black uppercase tracking-tight text-zinc-400 dark:text-zinc-600">
                      {assignedShoe.model}
                    </span>
                  </div>
                )}
              </div>

              {/* Membership Registration */}
              <div className="flex flex-col gap-4">
                <SectionTitle>REGISTRY</SectionTitle>
                <BioRow
                  theme={theme}
                  icon={<Calendar size={18} />}
                  label="JOINED IN"
                  value={memberSince}
                />
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
