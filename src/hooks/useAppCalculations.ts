import { useDataStore } from "../store/useDataStore";

export const useKpiStats = () => {
  return useDataStore((s) => s.kpiStats);
};

export const useLeaderboards = () => {
  return {
    pRaw: {
      "all-time": useDataStore((s) => s.atPerfs),
      open: useDataStore((s) => s.opPerfs),
    },
    playerLB_AT: useDataStore((s) => s.playerLB_AT),
    playerLB_OP: useDataStore((s) => s.playerLB_OP),
  };
};
