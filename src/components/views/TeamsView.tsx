import React from "react";
import { ASRNeonToggle } from "../common/ASRNeonToggle";
import { AnimatedListView } from "../common/AnimatedListView";
import { TeamProfile } from "../../types";
import { useDataStore } from "../../store/useDataStore";
import { useAppStore } from "../../store/useAppStore";
import { useAppNavigation, useTeamList } from "../../hooks/useDerivedData";

export const TeamsView = React.memo(({ theme }: { theme: "light" | "dark" }) => {
  const isLoading = useDataStore(s => s.isLoading);
  const teamCategory = useAppStore(s => s.teamCategory);
  const setTeamCategory = useAppStore(s => s.setTeamCategory);
  const { navigateToEntity } = useAppNavigation();
  
  const rankedTeams = useTeamList();

  const handleItemClick = React.useCallback((t: TeamProfile) => {
    navigateToEntity("team", t);
  }, [navigateToEntity]);

  const columns = React.useMemo(() => [
    {
      label: "POINTS",
      key: "pts",
      getValue: (t: TeamProfile) => (t.pts || 0).toFixed(2),
    },
  ], []);

  const handleTeamCategoryChange = React.useCallback((tc: string) => {
    setTeamCategory(tc as "gyms" | "teams");
    if (window.scrollY > 150) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [setTeamCategory]);

  return (
    <AnimatedListView
      title="GYMS & TEAMS"
      theme={theme}
      data={rankedTeams}
      searchPlaceholder="search gyms & teams..."
      isLoading={isLoading}
      onItemClick={handleItemClick}
      middleLabel={teamCategory === "gyms" ? "GYM" : "TEAM"}
      columns={columns}
      headerControls={
        <ASRNeonToggle
          options={[
            { label: "G", value: "gyms" },
            { label: "T", value: "teams" },
          ]}
          activeOption={teamCategory}
          onChange={handleTeamCategoryChange}
          layoutId="team-cat-pill"
          theme={theme}
          className="w-24 sm:w-32 shrink-0"
        />
      }
    />
  );
});

