import { create } from 'zustand';

export interface AppState {
  gen: "M" | "F";
  setGen: (gen: "M" | "F") => void;
  teamCategory: "gyms" | "teams";
  setTeamCategory: (cat: "gyms" | "teams") => void;
  mapMode: "map" | "list";
  setMapMode: (mode: "map" | "list") => void;
  playingVideoUrl: string | null;
  setPlayingVideoUrl: (url: string | null) => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  isSubmitModalOpen: boolean;
  setIsSubmitModalOpen: (val: boolean) => void;
  activeCourseId: string | null;
  setActiveCourseId: (id: string | null) => void;

  // Global UI Toggles & States
  isNavCompact: boolean;
  setIsNavCompact: (val: boolean) => void;
  isKeyboardOpen: boolean;
  setIsKeyboardOpen: (val: boolean) => void;
  isMapLocating: boolean;
  setIsMapLocating: (val: boolean) => void;
  isMapReady: boolean;
  setIsMapReady: (val: boolean) => void;
  
  // HomeView Caching & State
  homeVisibleRuns: number;
  setHomeVisibleRuns: (val: number) => void;
  homeVisibleSets: number;
  setHomeVisibleSets: (val: number) => void;
  homeCarouselIndex: number;
  setHomeCarouselIndex: (val: number) => void;
  homeAutoPlayTimer: number;
  setHomeAutoPlayTimer: (val: number) => void;
}

const getInitialGen = () => {
    try { return JSON.parse(localStorage.getItem("gen") || "null") || "M"; } catch { return "M"; }
};
const getInitialTeamCategory = () => {
    try { 
      const val = JSON.parse(localStorage.getItem("teamCategory") || "null");
      if (val === "countries") return "teams";
      return val || "gyms"; 
    } catch { return "gyms"; }
};
const getInitialMapMode = () => {
    try { return JSON.parse(localStorage.getItem("mapMode") || "null") || "map"; } catch { return "map"; }
};

export const useAppStore = create<AppState>((set) => ({
  gen: getInitialGen(),
  setGen: (gen) => {
    try {
      localStorage.setItem("gen", JSON.stringify(gen));
    } catch (e) {
      console.warn("localStorage setItem failed:", e);
    }
    set({ gen });
  },
  teamCategory: getInitialTeamCategory(),
  setTeamCategory: (teamCategory) => {
    try {
      localStorage.setItem("teamCategory", JSON.stringify(teamCategory));
    } catch (e) {
      console.warn("localStorage setItem failed:", e);
    }
    set({ teamCategory });
  },
  mapMode: getInitialMapMode(),
  setMapMode: (mapMode) => {
    try {
      localStorage.setItem("mapMode", JSON.stringify(mapMode));
    } catch (e) {
      console.warn("localStorage setItem failed:", e);
    }
    set({ mapMode });
  },
  playingVideoUrl: null,
  setPlayingVideoUrl: (playingVideoUrl) => set({ playingVideoUrl }),
  showOnboarding: false,
  setShowOnboarding: (showOnboarding) => set({ showOnboarding }),
  isSubmitModalOpen: false,
  setIsSubmitModalOpen: (isSubmitModalOpen) => set({ isSubmitModalOpen }),
  activeCourseId: null,
  setActiveCourseId: (activeCourseId) => set({ activeCourseId }),

  isNavCompact: false,
  setIsNavCompact: (isNavCompact) => set({ isNavCompact }),
  isKeyboardOpen: false,
  setIsKeyboardOpen: (isKeyboardOpen) => set({ isKeyboardOpen }),
  isMapLocating: false,
  setIsMapLocating: (isMapLocating) => set({ isMapLocating }),
  isMapReady: false,
  setIsMapReady: (isMapReady) => set({ isMapReady }),
  
  homeVisibleRuns: 10,
  setHomeVisibleRuns: (homeVisibleRuns) => set({ homeVisibleRuns }),
  homeVisibleSets: 10,
  setHomeVisibleSets: (homeVisibleSets) => set({ homeVisibleSets }),
  homeCarouselIndex: 0,
  setHomeCarouselIndex: (homeCarouselIndex) => set({ homeCarouselIndex }),
  homeAutoPlayTimer: 0,
  setHomeAutoPlayTimer: (homeAutoPlayTimer) => set({ homeAutoPlayTimer }),
}));
