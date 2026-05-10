import { useDataStore } from "../store/useDataStore";
import { useMemo } from "react";

export const useKpiStats = () => {
  return useDataStore((s) => s.kpiStats);
};

export const useLeaderboards = () => {
  const atPerfs = useDataStore((s) => s.atPerfs);
  const opPerfs = useDataStore((s) => s.opPerfs);
  const playerLB_AT = useDataStore((s) => s.playerLB_AT);
  const playerLB_OP = useDataStore((s) => s.playerLB_OP);

  return useMemo(() => ({
    pRaw: {
      "all-time": atPerfs,
      open: opPerfs,
    },
    playerLB_AT,
    playerLB_OP,
  }), [atPerfs, opPerfs, playerLB_AT, playerLB_OP]);
};
