import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { cn, formatLocation, formatFlagsWithSpace } from "../../lib/asr-utils";
import { ASRStatCard } from "../common/ASRStatCard";
import { BioStat } from "./BioComponents";
import { FallbackAvatar } from "../common/FallbackAvatar";
import {
  ProfileHeader,
  InspectorTabContainer,
  SectionTitle,
} from "./InspectorComponents";
import { ASRRankList } from "../list/ASRRankList";
import { ASRPromotionBanner, PromoType } from "../common/ASRPromotionBanner";

import { ASRNeonToggle } from "../common/ASRNeonToggle";
import { TokenChip } from "./VaultComponents";

import { TeamProfile, ASRDataContext } from "../../types";
import { useTeamDetailsData } from "../../hooks/useInspectorFormatting";

interface TeamDetailsProps {
  team: TeamProfile & Record<string, unknown>;
  dataContext: ASRDataContext;
  onEntityClick: (type: string, data: Record<string, unknown>) => void;
  theme: "light" | "dark";
  initialMode?: "open" | "all-time";
}

export const TeamDetails = React.memo(
  ({
    team,
    dataContext,
    onEntityClick,
    theme,
    initialMode,
  }: TeamDetailsProps) => {
    const [searchParams] = useSearchParams();

    const urlTab = searchParams.get("tab");
    const validTabs = ["players", "athletes", "setters", "vault", "bio"];
    
    // Use local state so modal updates don't trigger global tree re-renders
    const initialTabSafe = validTabs.includes(urlTab as string)
        ? urlTab === "athletes"
          ? "players"
          : (urlTab as string)
        : "players";
    const [uiTab, setUiTab] = useState<string>(initialTabSafe);
    const [contentTab, setContentTab] = useState<string>(initialTabSafe);
    
    const initialModeSafe = (searchParams.get("mode") as "open" | "all-time") ||
      initialMode ||
      "open";
    const [uiMode, setUiMode] = useState<"open" | "all-time">(initialModeSafe);
    const [contentMode, setContentMode] = useState<"open" | "all-time">(initialModeSafe);

    const {
      tMeta,
      players,
      setters,
      playerStats,
      setterStats,
      playerTuples,
      setterTuples,
      vaultItems,
    } = useTeamDetailsData(team, contentMode, dataContext);

    const randomPlayersPromo = useMemo(() => {
      const types: PromoType[] = ["coach"];
      return types[Math.floor(Math.random() * types.length)];
    }, []);

    return (
      <div
        className={cn(
          "flex flex-col relative pb-32 transition-colors",
          theme === "dark" ? "bg-[#030303]" : "bg-white",
        )}
      >
        <ProfileHeader
          theme={theme}
          avatar={<FallbackAvatar name={team.name} sizeCls="text-3xl" />}
          title={
            <span className="flex items-center gap-2">
              <span className="drop-shadow-xl shrink-0 text-xl whitespace-nowrap">
                {formatFlagsWithSpace(
                  tMeta.region ||
                    tMeta.flag ||
                    tMeta.country ||
                    team.region ||
                    team.flag ||
                    team.country,
                ) || "🛡️"}
              </span>
              <span className="truncate">{team.name}</span>
            </span>
          }
          subtitle={formatLocation(tMeta) || formatLocation(team)}
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
                { label: "PLAYERS", value: "players" },
                { label: "SETTERS", value: "setters" },
              ]}
              activeOption={uiTab}
              onChange={(t) => {
                setUiTab(t);
                React.startTransition(() => {
                  setContentTab(t);
                });
              }}
              layoutId="team-tabs"
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
          {contentTab === "bio" && (
            <InspectorTabContainer>
              <div className="flex flex-col gap-4">
                <SectionTitle>GYM PROFILE</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <BioStat
                    theme={theme}
                    label="WEBSITE"
                    value={tMeta?.website || team?.website || "-"}
                  />
                  <BioStat
                    theme={theme}
                    label="INSTAGRAM"
                    value={tMeta?.instagram || team?.instagram || "-"}
                  />
                  <BioStat
                    theme={theme}
                    label="YOUTUBE"
                    value={tMeta?.youtube || team?.youtube || "-"}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <SectionTitle>ROSTER</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <BioStat
                    theme={theme}
                    label="PLAYERS"
                    value={players.length}
                  />
                  <BioStat
                    theme={theme}
                    label="SETTERS"
                    value={setters.length}
                  />
                  <BioStat
                    theme={theme}
                    label="RECORD HOLDERS"
                    value={players.filter((p) => p.wins > 0).length}
                  />
                </div>
              </div>
            </InspectorTabContainer>
          )}
          {contentTab === "players" && (
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
                  layoutId="team-mode-pill"
                  theme={theme}
                  className="w-full max-w-[280px]"
                />
              </div>

              <div className="flex flex-col p-6 gap-10">
                <div className="grid grid-cols-2 gap-4">
                  <ASRStatCard label="POINTS" value={playerStats.points} />
                  <ASRStatCard label="RUNS" value={playerStats.runs} />
                </div>

                <div className="flex flex-col gap-6 pt-2">
                  <SectionTitle>VERIFIED PLAYERS</SectionTitle>
                  <ASRRankList
                    athletes={playerTuples}
                    valueLabel="PTS"
                    dataContext={dataContext}
                    onEntityClick={onEntityClick}
                    limit={20}
                    entityType="player"
                    hideSubtitle={true}
                  />
                </div>
                <div className="pt-8">
                  <ASRPromotionBanner type={randomPlayersPromo} theme={theme} />
                </div>
              </div>
            </div>
          )}
          {contentTab === "setters" && (
            <InspectorTabContainer>
              <div className="grid grid-cols-2 gap-4">
                <ASRStatCard label="IMPACT" value={setterStats.impact} />
                <ASRStatCard label="SETS" value={setterStats.sets} />
              </div>

              <div className="flex flex-col gap-6 pt-2">
                <SectionTitle>VERIFIED SETTERS</SectionTitle>
                <ASRRankList
                  athletes={setterTuples}
                  valueLabel="IMPACT"
                  dataContext={dataContext}
                  onEntityClick={onEntityClick}
                  limit={20}
                  entityType="setter"
                  hideSubtitle={true}
                />
              </div>
              <div className="pt-8">
                <ASRPromotionBanner type="setter" theme={theme} />
              </div>
            </InspectorTabContainer>
          )}

          {contentTab === "vault" && (
            <InspectorTabContainer className="gap-14 text-center">
              <div className="flex flex-col gap-8">
                <SectionTitle noPadding>MEDALS</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <TokenChip
                    theme={theme}
                    token={{
                      id: "gold",
                      title: "GOLD",
                      count: vaultItems.podium.gold,
                      icon: "🥇",
                    }}
                  />
                  <TokenChip
                    theme={theme}
                    token={{
                      id: "silver",
                      title: "SILVER",
                      count: vaultItems.podium.silver,
                      icon: "🥈",
                    }}
                  />
                  <TokenChip
                    theme={theme}
                    token={{
                      id: "bronze",
                      title: "BRONZE",
                      count: vaultItems.podium.bronze,
                      icon: "🥉",
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <SectionTitle noPadding>BONUSES</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vaultItems.tokens.map((token) => (
                    <TokenChip key={token.id} token={token} theme={theme} />
                  ))}
                </div>
              </div>
            </InspectorTabContainer>
          )}
        </div>
      </div>
    );
  },
);
