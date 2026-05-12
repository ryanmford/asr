const fs = require('fs');
const content = fs.readFileSync('src/components/views/HomeView.tsx', 'utf8');

const startStr = "{/* Card 1: PLAYERS & RUNS */}";
const endStr = "</motion.div>";
const afterEndStr = "\n      )}";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(afterEndStr, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find delimiters");
  process.exit(1);
}

const replacement = `{/* Card 1: PLAYERS & RUNS */}
          <div
            className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-start text-left cursor-pointer transition-all duration-300 group hover:bg-black/10 dark:hover:bg-white/10 hover:-translate-y-1 active:scale-[0.98] active:bg-black/10 dark:active:bg-white/10 min-h-[220px]"
            onClick={() => navigate("/players")}
          >
            {/* Sparkline bg */}
            <div className="absolute inset-x-0 bottom-0 top-1/4 opacity-20 pointer-events-none transition-opacity flex items-end mask-image-bottom">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={playersTrendData}>
                  <YAxis domain={["dataMin", "dataMax"]} hide />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="absolute top-0 right-0 p-6 pointer-events-none z-30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 origin-top-right">
              <User className="w-12 h-12 text-blue-500/20 dark:text-blue-500/30 group-hover:text-blue-500/40 transition-colors" />
            </div>

            <div className="flex flex-col items-start gap-1 z-10 w-full relative pt-2">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">Top Players</h2>
              <p className="text-sm font-medium text-zinc-500">View leaderboards & runs</p>
            </div>

            <div className="mt-auto pt-8 w-full flex items-center justify-between z-10 text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono font-medium">
                <span className="flex items-baseline gap-1"><strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base"><CountUp end={kpi.players || 0} /></strong> PLAYERS</span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="flex items-baseline gap-1"><strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base"><CountUp end={kpi.runs || 0} /></strong> RUNS</span>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-500 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
          </div>

          {/* Card 2: COURSES */}
          <div
            className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-start text-left cursor-pointer transition-all duration-300 group hover:bg-black/10 dark:hover:bg-white/10 hover:-translate-y-1 active:scale-[0.98] active:bg-black/10 dark:active:bg-white/10 min-h-[220px]"
            onClick={() => navigate("/courses")}
          >
            {/* Sparkline bg */}
            <div className="absolute inset-x-0 bottom-0 top-1/4 opacity-20 pointer-events-none transition-opacity flex items-end mask-image-bottom">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={coursesTrendData}>
                  <YAxis domain={["dataMin", "dataMax"]} hide />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="absolute top-0 right-0 p-6 pointer-events-none z-30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 origin-top-right">
              <MapPin className="w-12 h-12 text-emerald-500/20 dark:text-emerald-500/30 group-hover:text-emerald-500/40 transition-colors" />
            </div>

            <div className="flex flex-col items-start gap-1 z-10 w-full relative pt-2">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">All Courses</h2>
              <p className="text-sm font-medium text-zinc-500">Explore locations globally</p>
            </div>

            <div className="mt-auto pt-8 w-full flex items-center justify-between z-10 text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono font-medium">
                <span className="flex items-baseline gap-1"><strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base"><CountUp end={kpi.courses || 0} /></strong> COURSES</span>
                <span className="text-zinc-300 dark:text-zinc-700 hidden lg:inline">•</span>
                <span className="flex items-baseline gap-1"><strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base"><CountUp end={kpi.cities || 0} /></strong> CITIES</span>
                <span className="text-zinc-300 dark:text-zinc-700 hidden lg:inline">•</span>
                <span className="flex items-baseline gap-1"><strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base"><CountUp end={kpi.countries || 0} /></strong> COUNTRIES</span>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-500 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
          </div>

          {/* Card 3: GYMS & TEAMS */}
          <div
            className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-start text-left cursor-pointer transition-all duration-300 group hover:bg-black/10 dark:hover:bg-white/10 hover:-translate-y-1 active:scale-[0.98] active:bg-black/10 dark:active:bg-white/10 min-h-[220px]"
            onClick={() => navigate("/teams")}
          >
            <div className="absolute top-0 right-0 p-6 pointer-events-none z-30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 origin-top-right">
              <Users className="w-12 h-12 text-indigo-500/20 dark:text-indigo-500/30 group-hover:text-indigo-500/40 transition-colors" />
            </div>

            <div className="flex flex-col items-start gap-1 z-10 w-full relative pt-2">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">Find Teams</h2>
              <p className="text-sm font-medium text-zinc-500">Join squads and local gyms</p>
            </div>

            <div className="mt-auto pt-8 w-full flex items-center justify-between z-10 text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono font-medium">
                <span className="flex items-baseline gap-1"><strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base"><CountUp end={totalTeams || 0} /></strong> TEAMS</span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="flex items-baseline gap-1"><strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base"><CountUp end={totalGyms || 0} /></strong> GYMS</span>
              </div>
              <ArrowRight className="w-5 h-5 text-indigo-500 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
          </div>

          {/* Card 4: HALL OF FAME */}
          <div
            className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-start text-left cursor-pointer transition-all duration-300 group hover:bg-black/10 dark:hover:bg-white/10 hover:-translate-y-1 active:scale-[0.98] active:bg-black/10 dark:active:bg-white/10 min-h-[220px]"
            onClick={() => navigate("/hof")}
          >
            <div className="absolute top-0 right-0 p-6 pointer-events-none z-30 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12 origin-top-right">
              <Trophy className="w-12 h-12 text-amber-500/20 dark:text-amber-500/30 group-hover:text-amber-500/40 transition-colors" />
            </div>

            <div className="flex flex-col items-start gap-1 z-10 w-full relative pt-2">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">Hall of Fame</h2>
              <p className="text-sm font-medium text-zinc-500">All-time legends & medals</p>
            </div>

            <div className="mt-auto pt-8 w-full flex items-center justify-between z-10 text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono font-medium">
                <span className="flex items-baseline gap-1"><strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base"><CountUp end={totalMedals || 0} /></strong> MEDALS</span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="flex items-baseline gap-1 text-orange-500/80"><Activity className="w-4 h-4"/> <strong className="text-orange-500 tabular-nums text-sm sm:text-base"><CountUp end={totalFires || 0} /></strong> FIRES</span>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-500 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
          </div>
        `;

const prefix = content.substring(0, startIndex);
const suffix = content.substring(endIndex);

fs.writeFileSync('src/components/views/HomeView.tsx', prefix + replacement + suffix);
