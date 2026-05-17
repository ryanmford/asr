import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, animate, LayoutGroup } from "motion/react";
import { Calculator, Target, Trophy, ChevronDown, ChevronUp, Search, ArrowRight, X } from "lucide-react";
import { cn, THEME } from "../../lib/asr-utils";
import { PlayerProfile, ASRDataContext } from "../../types";
import { useDataStore } from "../../store/useDataStore";

const RollingNumber = React.memo(({ value, decimals = 2 }: { value: number, decimals?: number }) => {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        const currentVal = parseFloat(node.textContent || "0") || 0;
        const controls = animate(currentVal, value, {
            duration: 0.15,
            ease: "easeOut",
            onUpdate: (v) => {
                if (node) node.textContent = v.toFixed(decimals);
            }
        });
        return () => controls.stop();
    }, [value, decimals]);
    
    return <span ref={ref} className="tabular-nums">{value.toFixed(decimals)}</span>;
});

interface ASRTimeSimulatorProps {
  theme: "light" | "dark";
  courseRecord: number;
  records: Array<{ pKey: string; time: number; pts: number; rank: number | string }>;
  gender: "M" | "F";
  dataContext?: ASRDataContext;
  cName?: string;
}

export const ASRTimeSimulator = ({ theme, courseRecord, records, gender, dataContext, cName }: ASRTimeSimulatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetTime, setTargetTime] = useState<number>(courseRecord || 10);
  const [mode, setMode] = useState<"slider" | "goal">("slider");
  const [targetPts, setTargetPts] = useState<number>(90);
  const [selectedAthlete, setSelectedAthlete] = useState<PlayerProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const playerList_M_AT = useDataStore((s) => s.playerList_M_AT) || [];
  const playerList_F_AT = useDataStore((s) => s.playerList_F_AT) || [];

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const athletePool = useMemo(() => {
     return gender === "M" 
        ? playerList_M_AT.filter(p => !p.isDivider)
        : playerList_F_AT.filter(p => !p.isDivider);
  }, [gender, playerList_M_AT, playerList_F_AT]);

  const filteredAthletes = useMemo(() => {
     const poolToSort = [...athletePool].sort((a, b) => (b.runs || 0) - (a.runs || 0));
     if (!searchQuery) return poolToSort.slice(0, 5);
     const lower = searchQuery.toLowerCase();
     return poolToSort.filter(p => p.name && p.name.toLowerCase().includes(lower)).slice(0, 10);
  }, [athletePool, searchQuery]);

  const existingTime = useMemo(() => {
      if (!selectedAthlete || !records) return null;
      const rec = records.find(r => r.pKey === selectedAthlete.pKey);
      return rec ? rec.time : null;
  }, [selectedAthlete, records]);

  // Pre-fill selected athlete if someone is currently looking at their own runs or if we want a default
  // Just leave empty by default since we rely on manual selection

  // Initialize targetTime to median or average time if available
  useEffect(() => {
    if (records.length > 0 && !isOpen) {
      const times = records.map(r => r.time).filter(t => t > 0);
      times.sort((a, b) => a - b);
      const median = times[Math.floor(times.length / 2)] || courseRecord;
      setTargetTime(Number(median.toFixed(2)));
    }
  }, [records, courseRecord, isOpen]);

  const simulatedPts = courseRecord && targetTime > 0 ? Math.min(100, (courseRecord / targetTime) * 100) : 0;
  
  const simulatedPlacement = useMemo(() => {
    let rank = 1;
    for (let i = 0; i < records.length; i++) {
        if (targetTime < records[i].time) {
            break;
        }
        if (targetTime === records[i].time) {
            rank = Number(records[i].rank);
            break;
        }
        rank++;
    }
    return rank;
  }, [targetTime, records]);

  const liveLadderWindow = useMemo(() => {
      const recordsWithMe = [...records];
      const myKey = selectedAthlete ? selectedAthlete.pKey : "SIMULATED_USER";
      const myName = selectedAthlete ? selectedAthlete.name : "YOU";
      
      const myIndex = recordsWithMe.findIndex(r => r.pKey === myKey);
      if (myIndex !== -1) {
          recordsWithMe[myIndex] = { ...recordsWithMe[myIndex], time: targetTime, pts: simulatedPts };
      } else {
          recordsWithMe.push({ pKey: myKey, time: targetTime, pts: simulatedPts, rank: 0 });
      }

      // Add names
      const namedRecords = recordsWithMe.map(r => ({
          ...r,
          name: r.pKey === myKey ? myName : (athletePool.find(a => a.pKey === r.pKey)?.name || "Unknown"),
          isMe: r.pKey === myKey
      }));

      // Sort
      namedRecords.sort((a, b) => a.time - b.time);

      // Ranks
      let curRank = 1;
      for (let i = 0; i < namedRecords.length; i++) {
          if (i > 0 && namedRecords[i].time > namedRecords[i - 1].time) {
              curRank = i + 1;
          }
          namedRecords[i].rank = curRank;
      }

      const myLiveRankIndex = namedRecords.findIndex(r => r.isMe);
      const startIdx = Math.max(0, myLiveRankIndex - 1);
      const endIdx = Math.min(namedRecords.length, startIdx + 3);
      
      // Ensure we always return up to 3 items if possible
      let finalStart = startIdx;
      if (endIdx - startIdx < 3) {
          finalStart = Math.max(0, endIdx - 3);
      }

      return namedRecords.slice(finalStart, endIdx);
  }, [records, selectedAthlete, targetTime, simulatedPts, athletePool]);

  const [popEffect, setPopEffect] = useState<"cr" | "pr" | null>(null);
  const prevBeatsCR = useRef(false);
  const prevBeatsPR = useRef(false);

  useEffect(() => {
      const beatsCR = targetTime <= courseRecord;
      const beatsPR = !!existingTime && targetTime < existingTime;
      
      let shouldPop = false;
      let effectType: "cr" | "pr" | null = null;
      
      if (beatsCR && !prevBeatsCR.current) {
          shouldPop = true; effectType = "cr";
      } else if (beatsPR && !prevBeatsPR.current && !beatsCR) {
          shouldPop = true; effectType = "pr";
      }
      
      if (shouldPop && effectType) {
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
          setPopEffect(effectType);
          setTimeout(() => setPopEffect(null), 500);
      }
      
      prevBeatsCR.current = beatsCR;
      prevBeatsPR.current = beatsPR;
  }, [targetTime, courseRecord, existingTime]);

  // Goal calculating logic
  const requiredTimeForPts = useMemo(() => {
    if (courseRecord && targetPts > 0) {
      return (courseRecord / targetPts) * 100;
    }
    return 0;
  }, [courseRecord, targetPts]);

  const originalRanks = useMemo(() => {
     const ranks: Record<string, number> = {};
     const sorted = [...athletePool]
         .filter(a => a.currentRank !== "UR" && a.rating !== undefined)
         .sort((a, b) => (b.rating || 0) - (a.rating || 0));
     sorted.forEach((a, idx) => ranks[a.pKey] = idx + 1);
     return ranks;
  }, [athletePool]);

  const globalImpact = useMemo(() => {
     if (!selectedAthlete || !dataContext || !cName) return null;
     
     const existingTimesList = (dataContext.lbAT_Courses?.[gender]?.[cName] || {}) as Record<string, number>;
     
     // Determine the new simulated course record
     // Calculate the minimal time from all OTHER athletes
     let minOtherTime = Infinity;
     for (const pKey in existingTimesList) {
         const t = existingTimesList[pKey];
         if (pKey !== selectedAthlete.pKey && typeof t === "number" && t > 0 && t < minOtherTime) {
             minOtherTime = t;
         }
     }
     
     const simulatedCR = Math.min(minOtherTime !== Infinity ? minOtherTime : courseRecord, targetTime > 0 ? targetTime : courseRecord);
     const oldCR = courseRecord || 1;

     const simulatedRatings: Record<string, number> = {};
     let totalPointsDestroyed = 0;
     
     for (const pt of athletePool) {
         const baseRating = pt.rating || 0;
         const runs = pt.runs || 1; // Prevent division by zero mathematically
         const ptOriginalTime = existingTimesList[pt.pKey];
         
         let pointsDelta = 0;
         let runDelta = 0;
         
         if (pt.pKey === selectedAthlete.pKey) {
             const oldCoursePts = (typeof ptOriginalTime === "number" && ptOriginalTime > 0) ? Math.min(100, (oldCR / ptOriginalTime) * 100) : 0;
             const newCoursePts = targetTime > 0 ? Math.min(100, (simulatedCR / targetTime) * 100) : 0;
             
             pointsDelta = newCoursePts - oldCoursePts;
             if (typeof ptOriginalTime !== "number" || ptOriginalTime <= 0) {
                 runDelta = 1;
             }
         } else {
             if (typeof ptOriginalTime === "number" && ptOriginalTime > 0) {
                 const oldCoursePts = Math.min(100, (oldCR / ptOriginalTime) * 100);
                 const newCoursePts = Math.min(100, (simulatedCR / ptOriginalTime) * 100);
                 pointsDelta = newCoursePts - oldCoursePts;
                 if (pointsDelta < 0) {
                     totalPointsDestroyed += Math.abs(pointsDelta);
                 }
             }
         }
         
         if (runDelta > 0) {
             simulatedRatings[pt.pKey] = ((baseRating * runs) + pointsDelta) / (runs + runDelta);
         } else {
             simulatedRatings[pt.pKey] = baseRating + (pointsDelta / runs);
         }
     }

     const mySimRating = Math.round(simulatedRatings[selectedAthlete.pKey] * 1000000) / 1000000;
     let simulatedGlobalRank = 1;
     
     for (const pt of athletePool) {
         if (pt.pKey === selectedAthlete.pKey) continue;
         // Only compare against officially ranked athletes
         if (!pt.currentRank || pt.currentRank === "UR") continue;

         const theirSimRating = Math.round(simulatedRatings[pt.pKey] * 1000000) / 1000000;
         if (theirSimRating > mySimRating) {
             simulatedGlobalRank++;
         }
     }

     const currentRating = Math.round((selectedAthlete.rating || 0) * 1000000) / 1000000;
     
     // New ranks based on simulatedRatings
     const newRanks: Record<string, number> = {};
     const sortedNew = [...athletePool]
         .filter(a => a.currentRank !== "UR" && a.rating !== undefined)
         .sort((a, b) => simulatedRatings[b.pKey] - simulatedRatings[a.pKey]);
     sortedNew.forEach((a, idx) => newRanks[a.pKey] = idx + 1);

     let athletesDemoted = 0;
     for (const pKey of Object.keys(originalRanks)) {
         if (pKey === selectedAthlete.pKey) continue;
         if ((newRanks[pKey] || 0) > (originalRanks[pKey] || 0)) {
             athletesDemoted++;
         }
     }

     return {
         originalRating: selectedAthlete.rating || 0,
         newRating: mySimRating,
         originalRank: selectedAthlete.currentRank || "UR",
         newRank: simulatedGlobalRank,
         isImprovement: mySimRating > currentRating,
         pointsDestroyed: totalPointsDestroyed,
         athletesDemoted,
         beatsCR: targetTime < courseRecord,
         simulatedCR
     };
  }, [selectedAthlete, targetTime, dataContext, cName, gender, athletePool, courseRecord, originalRanks]);

  if (!courseRecord || records.length === 0) return null;

  const absoluteMax = Math.max(...records.map(r => r.time));
  const minTime = courseRecord * 0.8; // Allow predicting beating the CR by 20%
  
  // Smart maximum to avoid squishing the slider handle left when there are massive outliers
  let maxTime = courseRecord * 3;
  if(existingTime) {
      maxTime = Math.max(maxTime, existingTime * 1.2);
  }
  maxTime = Math.min(maxTime, absoluteMax * 1.1);
  if(maxTime < courseRecord) maxTime = courseRecord * 1.5;

  const handleSliderChange = (val: number) => {
      // Snapping logic near CR and PR
      const range = maxTime - minTime;
      const snapDist = range * 0.005; // 0.5% snap distance so it pops in but lets you pick close numbers

      if (Math.abs(val - courseRecord) < snapDist) {
          // If close to both, snap to whichever is closer
          if (existingTime && Math.abs(val - existingTime) < Math.abs(val - courseRecord)) {
              setTargetTime(existingTime);
          } else {
              setTargetTime(courseRecord);
          }
      } else if (existingTime && Math.abs(val - existingTime) < snapDist) {
          setTargetTime(existingTime);
      } else {
          setTargetTime(val);
      }
  };

  return (
    <div className={cn(
      "w-full transition-all duration-300 rounded-[1.5rem] border overflow-hidden mt-4",
      THEME.BENTO_CARD(theme)
    )}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            theme === "dark" ? "bg-white/10 text-white" : "bg-black/5 text-black"
          )}>
            <Calculator size={16} />
          </div>
          <div className="flex flex-col text-left">
            <span className={cn("font-black tracking-tight text-[15px]", "theme-text-base")}>STAT SIMULATOR</span>
            <span className={cn("text-[11px] uppercase tracking-wider font-semibold opacity-60", "theme-text-faint")}>
              Predict your stats
            </span>
          </div>
        </div>
        <div>
            {isOpen ? <ChevronUp size={20} className="opacity-50" /> : <ChevronDown size={20} className="opacity-50" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-2 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1 mb-6">
                <button 
                  onClick={() => setMode("slider")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-black rounded-lg transition-all",
                    mode === "slider" ? "bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white" : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
                  )}
                >
                    WHAT-IF SLIDER
                </button>
                <button 
                  onClick={() => setMode("goal")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-black rounded-lg transition-all",
                    mode === "goal" ? "bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white" : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
                  )}
                >
                    GOAL CALCULATOR
                </button>
            </div>

            {mode === "slider" && (
                <div className="flex flex-col gap-6">
                    {/* ATHLETE SIMULATOR SELECTOR */}
                    {dataContext && (
                        <div className="flex flex-col gap-2 relative z-50">
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1">Simulate As...</label>
                            {selectedAthlete ? (
                                <div className={cn(
                                    "flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
                                    theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-blue-500 uppercase">{selectedAthlete.name}</span>
                                            <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest flex items-center gap-1.5 flex-wrap mt-0.5">
                                                <span>{selectedAthlete.currentRank === "UR" || !selectedAthlete.currentRank ? "UR" : `#${selectedAthlete.currentRank}`}</span>
                                                <span className="opacity-50">|</span>
                                                <span>LQ: {(selectedAthlete.rating || 0).toFixed(2)}</span>
                                                <span className="opacity-50">|</span>
                                                <span>PTS: {Math.round((selectedAthlete.rating || 0) * (selectedAthlete.runs || 0))}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedAthlete(null)}
                                        className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} className="text-black dark:text-white" />
                                    </button>
                                </div>
                            ) : (
                                <div ref={searchRef} className="relative">
                                    <div className={cn(
                                        "flex items-center px-4 py-3 rounded-xl border focus-within:ring-2 focus-within:ring-blue-500 transition-all",
                                        theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                                    )}>
                                        <Search size={16} className="opacity-50 mr-3" />
                                        <input 
                                            type="text" 
                                            placeholder="Search athlete to simulate..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onFocus={() => setIsSearching(true)}
                                            className="bg-transparent border-none outline-none w-full text-sm font-medium"
                                        />
                                    </div>

                                    <AnimatePresence>
                                        {isSearching && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 5 }}
                                                className={cn(
                                                    "absolute top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto rounded-xl border shadow-xl flex flex-col p-1",
                                                    theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                                                )}
                                            >
                                                {filteredAthletes.length > 0 ? (
                                                    filteredAthletes.map((athlete) => (
                                                        <button
                                                            key={athlete.pKey}
                                                            onClick={() => {
                                                                setSelectedAthlete(athlete);
                                                                setIsSearching(false);
                                                                setSearchQuery("");
                                                                // If they have an existing time, maybe pre-fill the slider with it
                                                                const existingTime = (dataContext.lbAT_Courses?.[gender]?.[cName || ""] || {})[athlete.pKey] as number | undefined;
                                                                if (typeof existingTime === "number") {
                                                                    setTargetTime(existingTime);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "flex items-center justify-between px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-left",
                                                            )}
                                                        >
                                                            <span className="text-sm font-bold truncate">{athlete.name}</span>
                                                            <span className="text-xs font-mono opacity-60 font-bold">{athlete.runs || 0} run{(athlete.runs || 0) === 1 ? "" : "s"}</span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-xs opacity-50 text-center font-medium">No athletes found.</div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col mb-4">
                        <div className="flex items-end justify-between mb-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Simulated Time</span>
                                <div className="text-4xl font-black tabular-nums tracking-tighter">
                                    <RollingNumber value={targetTime} decimals={2} />s
                                </div>
                                {existingTime && targetTime < existingTime && (
                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">
                                        -{ (existingTime - targetTime).toFixed(2) }s PR!
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Est. Rank</span>
                                <div className={cn(
                                    "text-3xl font-black tabular-nums",
                                    targetTime <= courseRecord ? "text-yellow-500" : (existingTime && targetTime < existingTime) ? "text-blue-500" : "text-red-500"
                                )}>
                                    #<RollingNumber value={simulatedPlacement} decimals={0} />
                                </div>
                            </div>
                        </div>

                        {liveLadderWindow.length > 0 && (
                            <div className="flex flex-col gap-1 w-full bg-black/5 dark:bg-white/5 rounded-xl p-2 relative overflow-hidden">
                                <LayoutGroup>
                                   {liveLadderWindow.map((r) => (
                                       <motion.div 
                                           layout
                                           key={r.pKey}
                                           initial={false}
                                           className={cn(
                                               "flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors",
                                               r.isMe ? 
                                                  (targetTime <= courseRecord ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 font-bold" : 
                                                   (existingTime && targetTime < existingTime) ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold" :
                                                   "bg-black/10 dark:bg-white/10 font-bold") 
                                                  : "opacity-60"
                                           )}
                                       >
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-xs w-5">#{r.rank}</span>
                                                <span className="truncate max-w-[120px]">{r.name}</span>
                                            </div>
                                            <span className="font-mono tabular-nums">{r.time.toFixed(2)}s</span>
                                       </motion.div>
                                   ))}
                                </LayoutGroup>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="h-10 w-full relative group">
                            {/* Track background */}
                            <div className="absolute top-1/2 -translate-y-1/2 w-full h-3 rounded-full overflow-hidden bg-black/10 dark:bg-zinc-800 shadow-inner">
                                <div 
                                    className={cn(
                                        "absolute top-0 bottom-0 left-0 transition-colors duration-200 rounded-full",
                                        targetTime <= courseRecord ? "bg-gradient-to-r from-orange-400 via-yellow-400 to-yellow-500 shadow-[0_0_15px_rgba(234,179,8,1)]" : 
                                        (existingTime && targetTime < existingTime) ? "bg-gradient-to-r from-blue-400 to-blue-500" : 
                                        "bg-gradient-to-r from-zinc-400 to-red-400 dark:from-zinc-500 dark:to-red-600"
                                    )}
                                    style={{ width: `${Math.min(100, Math.max(0, ((targetTime - minTime) / (maxTime - minTime)) * 100))}%` }}
                                />
                            </div>
                            
                            {/* Current records indicators */}
                            {records.map((r, i) => {
                                const percent = Math.min(100, Math.max(0, ((r.time - minTime) / (maxTime - minTime)) * 100));
                                return (
                                    <div 
                                      key={i} 
                                      className="absolute top-1/2 -translate-y-1/2 w-[2px] h-3 bg-black/20 dark:bg-white/20 transition-all pointer-events-none"
                                      style={{ left: `${percent}%` }}
                                    />
                                );
                            })}
                            
                            {/* Course Record Marker */}
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 w-[2px] h-4 bg-yellow-500 z-10"
                              style={{ left: `${Math.min(100, Math.max(0, ((courseRecord - minTime) / (maxTime - minTime)) * 100))}%` }}
                            >
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-yellow-600 dark:text-yellow-500">
                                    CR
                                </div>
                            </div>
                            
                            {/* Existing PR Marker */}
                            {existingTime && (
                              <div 
                                className="absolute top-1/2 -translate-y-1/2 w-[2px] h-6 bg-blue-500 z-10"
                                style={{ left: `${Math.min(100, Math.max(0, ((existingTime - minTime) / (maxTime - minTime)) * 100))}%` }}
                              >
                                  <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-blue-500 bg-blue-500/10 px-1 rounded">
                                      PR
                                  </div>
                              </div>
                            )}

                            <input 
                                type="range" 
                                min={minTime} 
                                max={maxTime} 
                                step={0.01} 
                                value={targetTime} 
                                onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                                className="absolute inset-0 w-full opacity-0 cursor-ew-resize z-30"
                            />
                            
                            {/* Custom thumb */}
                            <div 
                              className={cn(
                                "absolute top-1/2 -translate-y-1/2 w-[6px] h-8 rounded-full shadow-lg pointer-events-none transition-all duration-75 z-20",
                                targetTime <= courseRecord ? "bg-yellow-500 scale-110" : 
                                (existingTime && targetTime < existingTime) ? "bg-blue-500 scale-110" : 
                                "bg-white dark:bg-red-500"
                              )}
                              style={{ left: `${Math.min(100, Math.max(0, ((targetTime - minTime) / (maxTime - minTime)) * 100))}%` }}
                            >
                                <AnimatePresence>
                                    {popEffect === "cr" && (
                                        <motion.div 
                                          initial={{ scale: 0, opacity: 1 }}
                                          animate={{ scale: 4, opacity: 0 }}
                                          exit={{ opacity: 0 }}
                                          transition={{ duration: 0.5, ease: "easeOut" }}
                                          className="absolute inset-[-4px] bg-yellow-400 rounded-full"
                                        />
                                    )}
                                    {popEffect === "pr" && (
                                         <motion.div 
                                           initial={{ scale: 0, opacity: 1 }}
                                           animate={{ scale: 4, opacity: 0 }}
                                           exit={{ opacity: 0 }}
                                           transition={{ duration: 0.5, ease: "easeOut" }}
                                           className="absolute inset-[-4px] bg-blue-400 rounded-full"
                                         />
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="flex justify-between text-[11px] font-black uppercase text-zinc-400">
                            <span>{minTime.toFixed(1)}s</span>
                            <span>{maxTime.toFixed(1)}s</span>
                        </div>
                    </div>

                    <div className="flex justify-center mt-2">
                         <div className={cn(
                            "px-4 py-2 rounded-xl flex items-center gap-3",
                            theme === "dark" ? "bg-zinc-800" : "bg-zinc-100"
                        )}>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Simulated Points</div>
                            <div className="text-xl font-black tabular-nums">
                                <RollingNumber value={simulatedPts} decimals={2} />
                            </div>
                        </div>
                    </div>

                    {/* GLOBAL IMPACT */}
                    {selectedAthlete && globalImpact && (
                         <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className={cn(
                                "flex flex-col gap-3 p-4 rounded-xl border relative overflow-hidden",
                                theme === "dark" ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200"
                            )}>
                                <div className="text-[11px] font-black uppercase text-blue-500 tracking-wider">
                                    All-Time Delta
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">LQ</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black opacity-50 line-through">{globalImpact.originalRating.toFixed(3)}</span>
                                            <ArrowRight size={12} className={globalImpact.isImprovement ? "text-blue-500" : "text-zinc-500"} />
                                            <div className={cn("text-lg font-black tabular-nums", globalImpact.isImprovement ? "text-blue-500" : "")}>
                                                <RollingNumber value={globalImpact.newRating} decimals={3} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Rank</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black opacity-50 line-through">
                                                {globalImpact.originalRank === "UR" ? "UR" : `#${globalImpact.originalRank}`}
                                            </span>
                                            <ArrowRight size={12} className={globalImpact.isImprovement ? "text-blue-500" : "text-zinc-500"} />
                                            <div className={cn("text-lg font-black tabular-nums", globalImpact.isImprovement ? "text-blue-500" : "")}>
                                                #<RollingNumber value={globalImpact.newRank} decimals={0} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {globalImpact.beatsCR && globalImpact.pointsDestroyed > 0.1 && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className={cn(
                                                "p-3 rounded-lg flex flex-col gap-2 relative overflow-hidden",
                                                theme === "dark" ? "bg-red-500/10 border border-red-500/20" : "bg-red-50 border border-red-200"
                                            )}>
                                                <div className="absolute -right-2 -bottom-4 text-red-500/10 dark:text-red-500/20 pointer-events-none">
                                                    <Trophy size={64} className="rotate-12" />
                                                </div>
                                                <div className="text-[10px] font-black uppercase text-red-500 tracking-wider flex items-center gap-1.5 z-10">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                    Collateral Damage
                                                </div>
                                                <div className="flex justify-between items-end z-10">
                                                    <div className="flex flex-col">
                                                        <span className={cn("text-[10px] font-bold uppercase opacity-60", theme === "dark" ? "text-red-100" : "text-red-900")}>Points Destroyed</span>
                                                        <span className="text-xl font-black text-red-500 tabular-nums">
                                                            -<RollingNumber value={globalImpact.pointsDestroyed} decimals={1} /> pts
                                                        </span>
                                                    </div>
                                                    {globalImpact.athletesDemoted > 0 && (
                                                        <div className="flex flex-col text-right">
                                                            <span className={cn("text-[10px] font-bold uppercase opacity-60", theme === "dark" ? "text-red-100" : "text-red-900")}>Players Demoted</span>
                                                            <span className="text-lg font-black text-red-500 tabular-nums">
                                                                {globalImpact.athletesDemoted}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            )}

            {mode === "goal" && (
                 <div className="flex flex-col gap-6">
                    <div className="text-sm font-medium leading-relaxed opacity-80 mt-1">
                        What time do I need to achieve a specific <strong className="font-black">Locomotive Quotient (LQ) / Points</strong> rating on this course?
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Target LQ / Points</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="number" 
                                value={targetPts}
                                max={100}
                                onChange={(e) => {
                                    let val = parseFloat(e.target.value) || 0;
                                    if (val > 100) val = 100;
                                    setTargetPts(val);
                                }}
                                className={cn(
                                    "w-full text-2xl font-black bg-transparent border-b-2 outline-none pb-1 tabular-nums",
                                    theme === "dark" ? "border-white/20 focus:border-red-500" : "border-black/20 focus:border-red-500"
                                )}
                            />
                            <span className="text-xl font-black opacity-30">PTS</span>
                        </div>
                    </div>

                     <div className={cn(
                        "p-5 rounded-[1.25rem] flex flex-col items-center justify-center relative overflow-hidden",
                        theme === "dark" ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-red-50 border border-red-200 text-red-600"
                    )}>
                        <Target className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
                        <span className="text-[10px] font-bold uppercase tracking-widest mb-1 z-10">Required Time</span>
                        <div className="text-4xl font-black tabular-nums tracking-tighter drop-shadow-sm z-10">
                            {requiredTimeForPts.toFixed(2)}s
                        </div>
                        <div className="text-xs font-bold mt-2 opacity-80 z-10 text-center">
                            {targetPts >= 100 ? "⚠️ This requires tying or breaking the CR!" : `This places you approx #${
                                records.filter(r => r.time <= requiredTimeForPts).length + 1
                            }`}
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};
