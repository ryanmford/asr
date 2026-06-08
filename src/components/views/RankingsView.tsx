import React, { useState } from "react";
import { ASRNeonToggle } from "../common/ASRNeonToggle";
import { AnimatedListView } from "../common/AnimatedListView";
import { PlayerProfile, TeamProfile } from "../../types";
import { useDataStore } from "../../store/useDataStore";
import { useAppStore } from "../../store/useAppStore";
import { useAppNavigation, usePlayerList, useTeamList, useURLState } from "../../hooks/useDerivedData";

export const RankingsView = React.memo(({ theme }: { theme: "light" | "dark" }) => {
  const isLoading = useDataStore(s => s.isLoading);
  const gen = useAppStore(s => s.gen);
  const setGen = useAppStore(s => s.setGen);
  const teamCategory = useAppStore(s => s.teamCategory);
  const setTeamCategory = useAppStore(s => s.setTeamCategory);
  const { navigateToEntity } = useAppNavigation();
  const { eventType } = useURLState();

  const [mode, setMode] = useState<"players" | "teams">("players");

  const playerList = usePlayerList();
  const teamList = useTeamList();

  const handlePlayerClick = React.useCallback((p: PlayerProfile) => {
    navigateToEntity("player", p);
  }, [navigateToEntity]);

  const handleTeamClick = React.useCallback((t: TeamProfile) => {
    navigateToEntity("team", t);
  }, [navigateToEntity]);

  const playerColumns = React.useMemo(() => [
    {
      label: "LQ",
      key: "rating",
      getValue: (p: PlayerProfile) => (p.rating || 0).toFixed(2),
    },
  ], []);

  const teamColumns = React.useMemo(() => [
    {
      label: "POINTS",
      key: "pts",
      getValue: (t: TeamProfile) => (t.pts || 0).toFixed(2),
    },
  ], []);

  const handleGenChange = React.useCallback((g: string) => {
    setGen(g as "M" | "F");
    if (window.scrollY > 150) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [setGen]);

  const handleTeamCategoryChange = React.useCallback((tc: string) => {
    setTeamCategory(tc as "gyms" | "teams");
    if (window.scrollY > 150) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [setTeamCategory]);

  const handleModeChange = React.useCallback((newMode: string) => {
    setMode(newMode as "players" | "teams");
    if (window.scrollY > 150) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const listData = React.useMemo(() => {
    if (mode === "teams") return teamList;
    if (eventType === "open") {
      return playerList.map((p) => {
        // We know 'currentRank' might be typed slightly generically in PlayerProfile,
        // but it comes through via usePlayerList
        const rank = (p as any).currentRank;
        if (typeof rank === "number" && rank >= 1 && rank <= 6) {
          if (rank <= 3) {
            return { ...p, name: `${p.name} * *` };
          } else {
            return { ...p, name: `${p.name} *` };
          }
        }
        return p;
      });
    }
    return playerList;
  }, [mode, eventType, playerList, teamList]);

  const listColumns = mode === "players" ? playerColumns : teamColumns;
  const itemClick = mode === "players" ? handlePlayerClick : handleTeamClick;
  const searchPlaceholder = mode === "players" ? "search players..." : "search gyms & teams...";
  const middleLabel = mode === "players" ? "PLAYER" : (teamCategory === "gyms" ? "GYM" : "TEAM");

  const searchSubtext = (mode === "players" && eventType === "open") ? (
    <div className="flex flex-col gap-1 mt-2 mb-1 w-full">
      <p className="text-[10px] sm:text-[11px] font-bold text-zinc-500/80 dark:text-zinc-500/80 tracking-widest uppercase">
        * * QUALIFIED FOR USPK NATIONALS & PKE WORLDS
      </p>
      <p className="text-[10px] sm:text-[11px] font-bold text-zinc-500/80 dark:text-zinc-500/80 tracking-widest uppercase">
        * QUALIFIED FOR PKE WORLDS
      </p>
    </div>
  ) : undefined;

  return (
    <AnimatedListView
      title="RANKINGS"
      hideTitle={true}
      theme={theme}
      data={listData}
      searchPlaceholder={searchPlaceholder}
      searchSubtext={searchSubtext}
      isLoading={isLoading}
      onItemClick={itemClick}
      middleLabel={middleLabel}
      columns={listColumns}
      categoryName={mode === "players" ? "Players" : "Teams"}
      topControls={
        <ASRNeonToggle
          options={[
            { label: "PLAYERS", value: "players" },
            { label: "TEAMS", value: "teams" },
          ]}
          activeOption={mode}
          onChange={handleModeChange}
          layoutId="primary-mode-pill"
          theme={theme}
          className="w-[200px] mb-3"
        />
      }
      headerControls={
        mode === "players" ? (
          <ASRNeonToggle
            options={[
              { label: "M", value: "M" },
              { label: "W", value: "F" },
            ]}
            activeOption={gen}
            onChange={handleGenChange}
            layoutId="gen-pill"
            theme={theme}
            className="w-[100px] shrink-0"
          />
        ) : (
          <ASRNeonToggle
            options={[
              { label: "G", value: "gyms" },
              { label: "T", value: "teams" },
            ]}
            activeOption={teamCategory}
            onChange={handleTeamCategoryChange}
            layoutId="team-cat-pill"
            theme={theme}
            className="w-[100px] shrink-0"
          />
        )
      }
    />
  );
});
