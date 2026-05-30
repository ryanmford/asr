/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState, useEffect, useRef, useDeferredValue } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { Trophy, ArrowRight, X } from "lucide-react";
import { cn } from "../../lib/asr-utils";
import { PlayerProfile, ASRDataContext } from "../../types";
import { dataWorker } from "../../hooks/useASRData";
import { ASRSearchInput } from "../common/ASRSearchInput";
import { 
  computeSimulatedPlacement, 
  computeOriginalRanks, 
  computeSimulatedGlobalImpact 
} from "../../lib/asr-data-compute";

interface ASRWhatIfSliderProps {
  theme: "light" | "dark";
  courseRecord: number;
  records: Array<{ pKey: string; time: number; pts: number; rank: number | string }>;
  gender: "M" | "F";
  dataContext?: ASRDataContext;
  cName?: string;
  athletePool: PlayerProfile[];
  RollingNumber: React.FC<{ value: number; decimals?: number }>;
  isOpen: boolean;
}

export const ASRWhatIfSlider = ({ theme, courseRecord, records, gender, dataContext, cName, athletePool, RollingNumber, isOpen }: ASRWhatIfSliderProps) => {
  const [rawTargetTime, setRawTargetTime] = useState<number>(courseRecord || 10);
  const [selectedAthlete, setSelectedAthlete] = useState<PlayerProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  useEffect(() => {
    if (records.length > 0 && !isOpen) {
      const times = records.map(r => r.time).filter(t => t > 0);
      times.sort((a, b) => a - b);
      const median = times[Math.floor(times.length / 2)] || courseRecord;
      setRawTargetTime(Number(median.toFixed(2)));
    }
  }, [records, courseRecord, isOpen]);

  const { minTime, maxTime } = useMemo(() => {
     if (!courseRecord || records.length === 0) return { minTime: 0, maxTime: 0 };
     const absoluteMax = Math.max(...records.map(r => r.time));
     const minT = courseRecord * 0.8;
     let maxT = courseRecord * 3;
     if(existingTime) maxT = Math.max(maxT, existingTime * 1.2);
     maxT = Math.min(maxT, absoluteMax * 1.1);
     if(maxT < courseRecord) maxT = courseRecord * 1.5;
     return { minTime: minT, maxTime: maxT };
  }, [courseRecord, records, existingTime]);

  const computedTargetTime = useMemo(() => {
     const range = maxTime - minTime;
     const snapDist = range * 0.005;

     if (Math.abs(rawTargetTime - courseRecord) < snapDist) {
         if (existingTime && Math.abs(rawTargetTime - existingTime) < Math.abs(rawTargetTime - courseRecord)) {
             return existingTime;
         }
         return courseRecord;
     } else if (existingTime && Math.abs(rawTargetTime - existingTime) < snapDist) {
         return existingTime;
     }
     return rawTargetTime;
  }, [rawTargetTime, courseRecord, existingTime, maxTime, minTime]);

  const targetTime = computedTargetTime;
  const deferredTargetTime = useDeferredValue(targetTime);

  const simulatedPts = courseRecord && deferredTargetTime > 0 ? Math.min(100, (courseRecord / deferredTargetTime) * 100) : 0;
  
  const simulatedPlacement = useMemo(() => {
      return computeSimulatedPlacement(deferredTargetTime, records);
  }, [deferredTargetTime, records]);

  const [liveLadderWindow, setLiveLadderWindow] = useState<any[]>([]);

  useEffect(() => {
      const myKey = selectedAthlete ? selectedAthlete.pKey : "SIMULATED_USER";
      const myName = selectedAthlete ? selectedAthlete.name : "YOU";
      
      const reqId = Date.now() + Math.random().toString();
      const handleMessage = (e: MessageEvent) => {
          if (e.data.type === 'LIVE_LADDER_READY' && e.data.payload.requestId === reqId) {
              setLiveLadderWindow(e.data.payload.result);
              dataWorker?.removeEventListener('message', handleMessage);
          }
      };
      
      dataWorker?.addEventListener('message', handleMessage);
      dataWorker?.postMessage({
          type: 'COMPUTE_LIVE_LADDER',
          payload: { requestId: reqId, records, myKey, myName, deferredTargetTime, simulatedPts, athletePool }
      });
      
      return () => {
          dataWorker?.removeEventListener('message', handleMessage);
      };
  }, [records, selectedAthlete, deferredTargetTime, simulatedPts, athletePool]);

  const [popEffect, setPopEffect] = useState<"cr" | "pr" | null>(null);
  const prevBeatsCR = useRef(false);
  const prevBeatsPR = useRef(false);

  useEffect(() => {
      const beatsCR = deferredTargetTime <= courseRecord;
      const beatsPR = !!existingTime && deferredTargetTime < existingTime;
      
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
  }, [deferredTargetTime, courseRecord, existingTime]);

  const originalRanks = useMemo(() => {
      return computeOriginalRanks(athletePool);
  }, [athletePool]);

  const globalImpact = useMemo(() => {
      if (!selectedAthlete || !dataContext || !cName) return null;
      const fullLeaderboards = (dataContext.lbAT_Courses?.[gender] || {}) as Record<string, Record<string, number>>;
      return computeSimulatedGlobalImpact(
          selectedAthlete, 
          deferredTargetTime, 
          cName,
          fullLeaderboards, 
          athletePool, 
          courseRecord, 
          originalRanks
      );
  }, [selectedAthlete, deferredTargetTime, dataContext, cName, gender, athletePool, courseRecord, originalRanks]);

  if (!courseRecord || records.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
        {dataContext && (
            <div className="flex flex-col gap-2 relative z-50">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 ml-1 hidden">Simulate As...</label>
                {selectedAthlete ? (
                    <div className={cn(
                        "flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all",
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
                                    <span>PTS: {((selectedAthlete.rating || 0) * (selectedAthlete.runs || 0)).toFixed(2)}</span>
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
                        <ASRSearchInput
                            value={searchQuery}
                            onChange={(e: any) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearching(true)}
                            theme={theme}
                            placeholder="search players..."
                        />

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
                                                    const existingT = (dataContext.lbAT_Courses?.[gender]?.[cName || ""] || {})[athlete.pKey] as number | undefined;
                                                    if (typeof existingT === "number") {
                                                        setRawTargetTime(existingT);
                                                    }
                                                }}
                                                className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-left"
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

        <div className="flex flex-col mb-2">
            <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex flex-col flex-1 relative">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-50 mb-1">Time</span>
                    <div className="text-3xl sm:text-4xl font-black tabular-nums tracking-tighter leading-none">
                        <RollingNumber value={targetTime} decimals={2} />s
                    </div>
                    <div className="h-3 relative mt-0.5 pointer-events-none">
                        <AnimatePresence>
                            {existingTime && targetTime < existingTime && (
                                <motion.span 
                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                    className="text-[9px] font-bold text-blue-500 uppercase tracking-widest absolute top-0 left-0 whitespace-nowrap"
                                >
                                    -{ (existingTime - targetTime).toFixed(2) }s PR!
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex flex-col items-center flex-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-50 mb-1">Points</span>
                    <div className={cn(
                        "text-2xl sm:text-3xl font-black tabular-nums leading-none tracking-tighter opacity-80"
                    )}>
                       <RollingNumber value={simulatedPts} decimals={2} />
                    </div>
                </div>

                <div className="flex flex-col items-end flex-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-50 mb-1">Est. Rank</span>
                    <div className={cn(
                        "text-3xl sm:text-4xl font-black tabular-nums leading-none tracking-tighter",
                        targetTime <= courseRecord ? "text-yellow-500" : (existingTime && targetTime < existingTime) ? "text-blue-500" : "text-red-500"
                    )}>
                        #<RollingNumber value={simulatedPlacement} decimals={0} />
                    </div>
                </div>
            </div>

            {liveLadderWindow.length > 0 && (
                <div className="flex flex-col gap-1 w-full bg-black/5 dark:bg-white/5 rounded-xl p-1.5 relative overflow-hidden">
                    <LayoutGroup>
                        {liveLadderWindow.map((r: any) => (
                            <motion.div 
                                layout
                                key={r.pKey}
                                initial={false}
                                className={cn(
                                    "flex items-center justify-between px-2.5 py-1 rounded-[0.5rem] text-xs transition-colors",
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

        <div className="flex flex-col gap-2">
            <div className="h-10 w-full relative group">
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
                
                <div 
                    className="absolute top-1/2 -translate-y-1/2 w-[2px] h-4 bg-yellow-500 z-10"
                    style={{ left: `${Math.min(100, Math.max(0, ((courseRecord - minTime) / (maxTime - minTime)) * 100))}%` }}
                >
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-yellow-600 dark:text-yellow-500">
                        CR
                    </div>
                </div>
                
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
                    value={rawTargetTime} 
                    onChange={(e) => setRawTargetTime(parseFloat(e.target.value))}
                    tabIndex={-1}
                    className="absolute top-1/2 -translate-y-1/2 w-full h-[60px] opacity-0 cursor-ew-resize z-30 touch-none"
                    style={{ WebkitAppearance: "none" }}
                />
                
                <motion.div 
                    animate={{ 
                        left: `${Math.min(100, Math.max(0, ((targetTime - minTime) / (maxTime - minTime)) * 100))}%` 
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
                    className={cn(
                    "absolute top-1/2 mt-[-16px] ml-[-3px] w-[6px] h-8 rounded-full shadow-lg pointer-events-none z-20",
                    targetTime <= courseRecord ? "bg-yellow-500 scale-110" : 
                    (existingTime && targetTime < existingTime) ? "bg-blue-500 scale-110" : 
                    "bg-white dark:bg-red-500"
                    )}
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
                </motion.div>
            </div>

            <div className="flex justify-between text-[11px] font-black uppercase text-zinc-400 mt-2">
                <span>{minTime.toFixed(2)}s</span>
                <span>{maxTime.toFixed(2)}s</span>
            </div>
        </div>

        {selectedAthlete && globalImpact && (
                <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className={cn(
                    "flex flex-col gap-2 p-3 rounded-xl border relative overflow-hidden",
                    theme === "dark" ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200"
                )}>
                    <div className="text-[11px] font-black uppercase text-blue-500 tracking-wider">
                        All-Time Delta
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
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
                                initial={{ opacity: 0, height: 0, margin: 0 }}
                                animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                                exit={{ opacity: 0, height: 0, margin: 0 }}
                                className="overflow-hidden"
                            >
                                <div className={cn(
                                    "p-2.5 rounded-lg flex flex-col gap-1 relative overflow-hidden",
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
                                                -<RollingNumber value={globalImpact.pointsDestroyed} decimals={2} /> pts
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
  );
};
