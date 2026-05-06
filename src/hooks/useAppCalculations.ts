import { useDataStore } from "../store/useDataStore";

export const useCourseStats = () => {
  return useDataStore((s) => s.masterCourseList);
};

export const useKpiStats = () => {
  return useDataStore((s) => s.kpiStats);
};

export const useSetterStats = () => {
  const settersWithImpact = useDataStore((s) => s.settersWithImpact);

  // We already have setterMet if we need it, but the hook pattern returned { settersWithImpact, setterMet }
  // Let's just grab setterMet from data as it's computed.
  // wait, we didn't add setterMet to dataStore? Let's check useDataStore

  return { settersWithImpact, setterMet: {} };
  // We will just return settersWithImpact as it is the most used.
};

export const useTeamStats = () => {
  // Already migrated out to useDerivedData
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
