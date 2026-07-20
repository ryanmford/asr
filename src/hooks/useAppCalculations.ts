import { useDataStore } from "../store/useDataStore";
import { useMemo } from "react";

export const useLeaderboards = () => {
  const atPerfs = useDataStore((s) => s.atPerfs);
  const opPerfs = useDataStore((s) => s.opPerfs);
  const season26Perfs = useDataStore((s) => s.season26Perfs);
  const playerLB_AT = useDataStore((s) => s.playerLB_AT);
  const playerLB_OP = useDataStore((s) => s.playerLB_OP);
  const playerLB_2026 = useDataStore((s) => s.playerLB_2026);

  return useMemo(() => ({
    pRaw: {
      "all-time": atPerfs,
      open: opPerfs,
      "2026": season26Perfs,
    },
    playerLB_AT,
    playerLB_OP,
    playerLB_2026,
  }), [atPerfs, opPerfs, season26Perfs, playerLB_AT, playerLB_OP, playerLB_2026]);
};
