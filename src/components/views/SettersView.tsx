import React from "react";
import { AnimatedListView } from "../common/AnimatedListView";
import { SetterProfile } from "../../types";
import { useDataStore } from "../../store/useDataStore";
import { useAppNavigation, useSettersListOut } from "../../hooks/useDerivedData";

export const SettersView = React.memo(({ theme }: { theme: "light" | "dark" }) => {
  const isLoading = useDataStore(s => s.isLoading);
  const { navigateToEntity } = useAppNavigation();
  
  const settersList = useSettersListOut();
  
  const handleItemClick = React.useCallback((s: SetterProfile) => {
    navigateToEntity("setter", s);
  }, [navigateToEntity]);

  const columns = React.useMemo(() => [
    {
      label: "IMPACT",
      key: "impact",
      getValue: (s: SetterProfile) =>
        Math.round(
          typeof s.impact === "number"
            ? s.impact
            : parseFloat(String(s.impact || 0)),
        ),
    },
  ], []);

  return (
    <AnimatedListView
      title="SETTERS"
      theme={theme}
      data={settersList}
      searchPlaceholder="search setters..."
      isLoading={isLoading}
      onItemClick={handleItemClick}
      middleLabel="SETTER"
      columns={columns}
    />
  );
});

