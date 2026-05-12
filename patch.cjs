const fs = require('fs');
const content = fs.readFileSync('src/components/views/HomeView.tsx', 'utf8');

const startStr = "{/* Navigation Cards */}";
const endStr = "{/* Featured Section */}";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find delimiters");
  process.exit(1);
}

const replacement = `{/* Unified Stats & Navigation Cards */}
      {isLoading ? (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-black/5 dark:bg-white/5 rounded-3xl p-6 h-[260px] flex flex-col items-center justify-center gap-4 animate-pulse"
            >
              <div className="w-8 h-8 bg-black/10 dark:bg-white/10 rounded-full" />
              <div className="w-20 h-10 bg-black/10 dark:bg-white/10 rounded-lg" />
              <div className="w-16 h-4 bg-black/10 dark:bg-white/10 rounded-full" />
              <div className="w-full h-12 bg-black/10 dark:bg-white/10 rounded-xl mt-4" />
            </div>
          ))}
        </motion.div>
      ) : (
        <motion.div
           variants={itemVariants}
           className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
           {/* Card 1: PLAYERS & RUNS */}
           <div 
             className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-center text-center cursor-pointer transition-all duration-300 group hover:bg-black/10 dark:hover:bg-white/10 hover:-translate-y-1 active:scale-[0.98] active:bg-black/10 dark:active:bg-white/10 min-h-[260px]"
             onClick={() => navigate("/players")}
           >
              {/* Sparkline bg */}
              <div className="absolute inset-0 bottom-0 top-1/4 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity flex items-end">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={playersTrendData}>
                    <YAxis domain={["dataMin", "dataMax"]} hide />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={true} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <User className="w-8 h-8 opacity-50 text-blue-500 mb-4 group-hover:opacity-100 group-hover:scale-110 transition-all z-10" />
              <div className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter text-zinc-900 dark:text-white z-10">
                 <CountUp end={kpi.players || 0} />
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest mt-1 mb-auto z-10">
                 Players
              </div>
              <div className="w-full pt-4 mt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between z-10 relative">
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Runs</span>
                    <span className="text-base sm:text-lg font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
                      <CountUp end={kpi.runs || 0} />
                    </span>
                 </div>
                 <div className="flex items-center text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-blue-500 transition-colors">
                    View <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                 </div>
              </div>
           </div>

           {/* Card 2: COURSES */}
           <div 
             className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-center text-center cursor-pointer transition-all duration-300 group hover:bg-black/10 dark:hover:bg-white/10 hover:-translate-y-1 active:scale-[0.98] active:bg-black/10 dark:active:bg-white/10 min-h-[260px]"
             onClick={() => navigate("/courses")}
           >
              {/* Sparkline bg */}
              <div className="absolute inset-0 bottom-0 top-1/4 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity flex items-end">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={coursesTrendData}>
                    <YAxis domain={["dataMin", "dataMax"]} hide />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={true} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <MapPin className="w-8 h-8 opacity-50 text-emerald-500 mb-4 group-hover:opacity-100 group-hover:scale-110 transition-all z-10" />
              <div className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter text-zinc-900 dark:text-white z-10">
                 <CountUp end={kpi.courses || 0} />
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mt-1 mb-auto z-10">
                 Courses
              </div>
              <div className="w-full pt-4 mt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between z-10 relative">
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cities</span>
                    <span className="text-base sm:text-lg font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
                      <CountUp end={kpi.cities || 0} />
                    </span>
                 </div>
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Countries</span>
                    <span className="text-base sm:text-lg font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
                      <CountUp end={kpi.countries || 0} />
                    </span>
                 </div>
                 <div className="flex items-center text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">
                    View <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                 </div>
              </div>
           </div>

           {/* Card 3: GYMS & TEAMS */}
           <div 
             className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-center text-center cursor-pointer transition-all duration-300 group hover:bg-black/10 dark:hover:bg-white/10 hover:-translate-y-1 active:scale-[0.98] active:bg-black/10 dark:active:bg-white/10 min-h-[260px]"
             onClick={() => navigate("/teams")}
           >
              <Users className="w-8 h-8 opacity-50 text-indigo-500 mb-4 group-hover:opacity-100 group-hover:scale-110 transition-all z-10" />
              <div className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter text-zinc-900 dark:text-white z-10 flex items-start justify-center gap-4">
                 <div className="flex flex-col items-center">
                   <CountUp end={totalTeams} />
                   <div className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-500 uppercase tracking-widest mt-1">
                     Teams
                   </div>
                 </div>
                 <div className="text-2xl text-zinc-300 dark:text-zinc-700 font-light mt-1">+</div>
                 <div className="flex flex-col items-center">
                   <CountUp end={totalGyms} />
                   <div className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-500 uppercase tracking-widest mt-1">
                     Gyms
                   </div>
                 </div>
              </div>
              <div className="mt-auto mb-auto"></div>
              <div className="w-full pt-4 mt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between z-10 relative">
                 <div className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Find your squad
                 </div>
                 <div className="flex items-center text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">
                    View <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                 </div>
              </div>
           </div>

           {/* Card 4: MEDALS / HOF */}
           <div 
             className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-center text-center cursor-pointer transition-all duration-300 group hover:bg-black/10 dark:hover:bg-white/10 hover:-translate-y-1 active:scale-[0.98] active:bg-black/10 dark:active:bg-white/10 min-h-[260px]"
             onClick={() => navigate("/hof")}
           >
              <Trophy className="w-8 h-8 opacity-50 text-amber-500 mb-4 group-hover:opacity-100 group-hover:scale-110 transition-all z-10 group-hover:rotate-12" />
              <div className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter text-zinc-900 dark:text-white z-10">
                 <CountUp end={totalMedals} />
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-1 mb-auto z-10">
                 Total Medals
              </div>
              <div className="w-full pt-4 mt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between z-10 relative">
                 <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Activity className="w-3 h-3"/> Active Fires</span>
                    <span className="text-base sm:text-lg font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
                      <CountUp end={totalFires} />
                    </span>
                 </div>
                 <div className="flex items-center text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-amber-500 transition-colors">
                    View <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                 </div>
              </div>
           </div>
        </motion.div>
      )}

      `;

const prefix = content.substring(0, startIndex);
const suffix = content.substring(endIndex);

fs.writeFileSync('src/components/views/HomeView.tsx', prefix + replacement + suffix);
