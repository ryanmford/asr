export interface PlayerProfile {
  pKey: string;
  name: string;
  gender: "M" | "F";
  rating: number;
  runs: number;
  wins?: number;
  allTimeFireCount?: number;
  homeGym?: string;
  gymFlag?: string;
  townFlag?: string;
  teams?: { name: string; flag?: string; location?: string }[];
  teamLocation?: string;
  searchKey?: string;
  isDivider?: boolean;
}

export interface CourseData {
  name: string;
  videoUrl?: string;
  city?: string;
  country?: string;
  flag?: string;
  continent?: string;
  continentFlag?: string;
  mRecord?: number | null;
  fRecord?: number | null;
  totalAthletes?: number;
  totalRuns?: number;
  allTimeMRecord?: number | null;
  allTimeFRecord?: number | null;
  allTimeAthletesM?: [string, number, string?][];
  allTimeAthletesF?: [string, number, string?][];
  athletesMAll?: [string, number, string?][];
  athletesFAll?: [string, number, string?][];
  totalAllTimeAthletes?: number;
  totalAllTimeRuns?: number;
  parsedCoords?: [number, number] | null;
  leadSettersNormalized?: string[];
  leadSetters?: string | string[];
  assistantSettersNormalized?: string[];
  assistantsetters?: string | string[];
  is2026?: boolean;
  dateSet?: string;
}

export interface SetterProfile {
  name: string;
  leads: number;
  assists: number;
  sets: number;
  impact: number;
  films: number;
  isAthlete: boolean;
  searchKey?: string;
}

export interface TeamProfile {
  name: string;
  flag: string;
  location?: string;
  pts: number;
  players: PlayerProfile[];
  playersCount: number;
  bestPlayers: PlayerProfile[];
  runsCount: number;
  searchKey?: string;
}

export interface ASRDataContext {
  lbAT?: { M?: Record<string, unknown>; F?: Record<string, unknown> };
  lbOP?: { M?: Record<string, unknown>; F?: Record<string, unknown> };
  atMet?: Record<string, unknown>;
  cMet?: Record<string, unknown>;
  pRaw?: Record<string, Record<string, unknown[]>>;
  courseRunsHistory?: Record<string, unknown[]>;
  setterMet?: Record<string, unknown>;
  lbAT_Courses?: { M?: Record<string, unknown>; F?: Record<string, unknown> };
  lbOP_Courses?: { M?: Record<string, unknown>; F?: Record<string, unknown> };
  masterCourseList?: unknown[];
  courseRecords_M_AT?: Record<string, unknown>;
  courseRecords_F_AT?: Record<string, unknown>;
  courseRecords_M_OP?: Record<string, unknown>;
  courseRecords_F_OP?: Record<string, unknown>;
}
