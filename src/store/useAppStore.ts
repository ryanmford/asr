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
    localStorage.setItem("gen", JSON.stringify(gen));
    set({ gen });
  },
  teamCategory: getInitialTeamCategory(),
  setTeamCategory: (teamCategory) => {
    localStorage.setItem("teamCategory", JSON.stringify(teamCategory));
    set({ teamCategory });
  },
  mapMode: getInitialMapMode(),
  setMapMode: (mapMode) => {
    localStorage.setItem("mapMode", JSON.stringify(mapMode));
    set({ mapMode });
  },
  playingVideoUrl: null,
  setPlayingVideoUrl: (playingVideoUrl) => set({ playingVideoUrl }),
}));
