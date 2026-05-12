import { create } from 'zustand';
import type { PlayerProfile, CourseData, SetterProfile, TeamProfile } from '../types';

interface ASRDataState {
  data: PlayerProfile[];
  openData: PlayerProfile[];
  atPerfs: Record<string, unknown>;
  opPerfs: Record<string, unknown>;
  lbAT: { M: Record<string, unknown>; F: Record<string, unknown> };
  lbOpen: { M: Record<string, unknown>; F: Record<string, unknown> };
  atMet: Record<string, unknown>;
  dnMap: Record<string, string>;
  cMet: Record<string, unknown>;
  settersData: SetterProfile[];
  atRawBest: Record<string, unknown>;
  opRawBest: Record<string, unknown>;
  recentFeed: unknown[];
  courseRunsHistory: Record<string, unknown[]>;
  
  // Computed Data
  masterCourseList: CourseData[];
  kpiStats: Record<string, unknown> | null;
  kpiTrends: Record<string, { value: number }[]> | null;
  settersWithImpact: SetterProfile[];
  setterMet: Record<string, unknown>;
  teamsAggregated: TeamProfile[];
  playerLB_AT: { M: PlayerProfile[]; F: PlayerProfile[] };
  playerLB_OP: { M: PlayerProfile[]; F: PlayerProfile[] };

  // Pre-computed lists
  playerList_M_AT: PlayerProfile[];
  playerList_F_AT: PlayerProfile[];
  playerList_M_OP: PlayerProfile[];
  playerList_F_OP: PlayerProfile[];
  courseList_AT: CourseData[];
  courseList_OP: CourseData[];
  settersList: SetterProfile[];
  teamList_gyms_AT: TeamProfile[];
  teamList_teams_AT: TeamProfile[];
  teamList_gyms_OP: TeamProfile[];
  teamList_teams_OP: TeamProfile[];

  isLoading: boolean;
  isSyncing: boolean;
  hasError: boolean;
  hasPartialError: boolean;
  lastUpdated: number | null;
  refreshTrigger: number;
  triggerRefresh: () => void;
  
  setData: (payload: Partial<ASRDataState>) => void;
  setFetchStatus: (status: { isLoading?: boolean; isSyncing?: boolean; hasError?: boolean; hasPartialError?: boolean }) => void;
}

export const useDataStore = create<ASRDataState>((set) => {
  // Check if initial data was provided synchronously via SSR
  let initialData = {};
  let initialIsLoading = true;

  if (typeof window !== "undefined" && "window" in globalThis && (window as unknown as { __INITIAL_DATA__?: any }).__INITIAL_DATA__) {
    initialData = (window as unknown as { __INITIAL_DATA__?: any }).__INITIAL_DATA__;
    initialIsLoading = false;
  } else if (typeof window !== "undefined") {
    // Fire off async fetch to avoid main thread blockage during boot
    setTimeout(() => {
      try {
        const cached = localStorage.getItem("asr_data_vault_v1_integrated_v60_teams");
        if (cached) {
          const parsed = JSON.parse(cached);
          set(state => {
            // Unnecessary to override if we fetched live data by the time this runs
            if (!state.isLoading) return state;
            return { ...state, ...parsed, isLoading: false };
          });
        }
      } catch {
        // Ignore
      }
    }, 0);
  }

  return {
    data: [],
    openData: [],
    atPerfs: {},
    opPerfs: {},
    lbAT: { M: {}, F: {} },
    lbOpen: { M: {}, F: {} },
    atMet: {},
    dnMap: {},
    cMet: {},
    settersData: [],
    atRawBest: {},
    opRawBest: {},
    recentFeed: [],
    courseRunsHistory: {},

    masterCourseList: [],
    kpiStats: null,
    kpiTrends: null,
    settersWithImpact: [],
    setterMet: {},
    teamsAggregated: [],
    playerLB_AT: { M: {}, F: {} },
    playerLB_OP: { M: {}, F: {} },

    playerList_M_AT: [],
    playerList_F_AT: [],
    playerList_M_OP: [],
    playerList_F_OP: [],
    courseList_AT: [],
    courseList_OP: [],
    settersList: [],
    teamList_gyms_AT: [],
    teamList_teams_AT: [],
    teamList_gyms_OP: [],
    teamList_teams_OP: [],

    ...initialData,

    isLoading: initialIsLoading,
    isSyncing: false,
    hasError: false,
    hasPartialError: false,
    lastUpdated: null,
    refreshTrigger: 0,

    triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
    setData: (payload) => set((state) => ({ ...state, ...payload })),
    setFetchStatus: (status) => set((state) => ({ ...state, ...status })),
  };
});
