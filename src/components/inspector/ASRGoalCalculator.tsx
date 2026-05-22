import React, { useMemo } from "react";
import { Target } from "lucide-react";
import { cn } from "../../lib/asr-utils";

interface ASRGoalCalculatorProps {
  theme: "light" | "dark";
  courseRecord: number;
  records: Array<{ time: number; rank: number | string; pKey: string; pts: number }>;
  targetPts: number;
  setTargetPts: (v: number) => void;
}

export const ASRGoalCalculator = ({ theme, courseRecord, records, targetPts, setTargetPts }: ASRGoalCalculatorProps) => {
  const requiredTimeForPts = useMemo(() => {
    if (courseRecord && targetPts > 0) {
      return (courseRecord / targetPts) * 100;
    }
    return 0;
  }, [courseRecord, targetPts]);

  return (
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
                       "w-full text-[16px] sm:text-2xl font-black bg-transparent border-b-2 outline-none pb-1 tabular-nums",
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
  );
};
