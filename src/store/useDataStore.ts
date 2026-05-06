import { create } from 'zustand';

interface ASRDataState {
  data: unknown[];
  openData: unknown[];
  atPerfs: unknown;
  opPerfs: unknown;
  lbAT: { M: unknown; F: unknown };
  lbOpen: { M: unknown; F: unknown };
  atMet: unknown;
  dnMap: unknown;
  cMet: unknown;
  settersData: unknown[];
  atRawBest: unknown;
  opRawBest: unknown;
  recentFeed: unknown[];
  courseRunsHistory: Record<string, unknown[]>;
  
  // Computed Data
  masterCourseList: unknown[];
  kpiStats: unknown;
  settersWithImpact: unknown[];
  setterMet: unknown;
  teamsAggregated: unknown[];
  playerLB_AT: { M: unknown; F: unknown };
  playerLB_OP: { M: unknown; F: unknown };

  // Pre-computed lists
  playerList_M_AT: unknown[];
  playerList_F_AT: unknown[];
  playerList_M_OP: unknown[];
  playerList_F_OP: unknown[];
  courseList_AT: unknown[];
  courseList_OP: unknown[];
  settersList: unknown[];
  teamList_M_AT: unknown[];
  teamList_F_AT: unknown[];
  teamList_Coed_AT: unknown[];
  teamList_M_OP: unknown[];
  teamList_F_OP: unknown[];
  teamList_Coed_OP: unknown[];

  isLoading: boolean;
  isSyncing: boolean;
  hasError: boolean;
  hasPartialError: boolean;
  lastUpdated: number | null;
  
  setData: (payload: Partial<ASRDataState>) => void;
  setFetchStatus: (status: { isLoading?: boolean; isSyncing?: boolean; hasError?: boolean; hasPartialError?: boolean }) => void;
}

export const useDataStore = create<ASRDataState>((set) => ({
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
  teamList_M_AT: [],
  teamList_F_AT: [],
  teamList_Coed_AT: [],
  teamList_M_OP: [],
  teamList_F_OP: [],
  teamList_Coed_OP: [],

  isLoading: true,
  isSyncing: false,
  hasError: false,
  hasPartialError: false,
  lastUpdated: null,

  setData: (payload) => set((state) => ({ ...state, ...payload })),
  setFetchStatus: (status) => set((state) => ({ ...state, ...status })),
}));
