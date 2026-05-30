import React from "react";
import { ASRNeonToggle } from "../common/ASRNeonToggle";
import { AnimatedListView } from "../common/AnimatedListView";
import { PlayerProfile } from "../../types";
import { useDataStore } from "../../store/useDataStore";
import { useAppStore } from "../../store/useAppStore";
import { useAppNavigation, usePlayerList } from "../../hooks/useDerivedData";

export const PlayersView = React.memo(({ theme }: { theme: "light" | "dark" }) => {
  const isLoading = useDataStore(s => s.isLoading);
  const gen = useAppStore(s => s.gen);
  const setGen = useAppStore(s => s.setGen);
  const { navigateToEntity } = useAppNavigation();
  
  const playerList = usePlayerList();
  
  const handleItemClick = React.useCallback((p: PlayerProfile) => {
    navigateToEntity("player", p);
  }, [navigateToEntity]);

  const columns = React.useMemo(() => [
    {
      label: "LQ",
      key: "rating",
      getValue: (p: PlayerProfile) => (p.rating || 0).toFixed(2),
    },
  ], []);

  const handleGenChange = React.useCallback((g: string) => {
    setGen(g as "M" | "F");
    if (window.scrollY > 150) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [setGen]);

  return (
    <AnimatedListView
      title="PLAYERS"
      hideTitle={true}
      theme={theme}
      data={playerList}
      searchPlaceholder="search players..."
      isLoading={isLoading}
      onItemClick={handleItemClick}
      middleLabel="PLAYER"
      columns={columns}
      categoryName="Players"
      headerControls={
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
      }
    />
  );
});

