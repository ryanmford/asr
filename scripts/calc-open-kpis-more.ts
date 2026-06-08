import { fetchGoogleSheetCSV } from '../src/lib/asr-data';
import { CONFIG, fixCountryEntity } from '../src/lib/asr-utils';

function parseCSV(csvString: string) {
    const lines = csvString.split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
        const values: string[] = [];
        let inQuotes = false;
        let current = "";
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { values.push(current); current = ""; }
            else current += char;
        }
        values.push(current);
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
            obj[h] = values[i] ? values[i].trim().replace(/^"|"$/g, '') : "";
        });
        return obj;
    });
}

function parseDateOrEvent(r: any) {
    const dStr = r["Date "] || r["Date"] || r["TIMESTAMP"] || r["Timestamp"];
    let d = NaN;
    if (dStr && typeof dStr === 'string') {
        const cleanD = dStr.replace(/\?|\s/g, '');
        if (cleanD.length >= 8) d = new Date(cleanD + "T12:00:00Z").getTime();
    }
    const event = (r["Event "] || r["Event"] || "").toUpperCase();
    return { d, event };
}

async function main() {
    const liveFeedCSV = await fetchGoogleSheetCSV(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_GIDS.LIVE);
    const setsCSV = await fetchGoogleSheetCSV(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_GIDS.SETS);
    const mensCSV = await fetchGoogleSheetCSV(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_GIDS.MENS);
    const womensCSV = await fetchGoogleSheetCSV(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_GIDS.WOMENS);

    const liveData = parseCSV(liveFeedCSV);
    const setsData = parseCSV(setsCSV);
    const athletesData = [...parseCSV(mensCSV), ...parseCSV(womensCSV)];

    const OPEN_START = new Date("2026-03-02T00:00:00Z").getTime();
    const OPEN_END = new Date("2026-05-31T23:59:59Z").getTime();

    function inWindow(d, eventStr) {
        if (!isNaN(d) && d >= OPEN_START && d <= OPEN_END) return true;
        if (eventStr.includes("OPEN")) return true;
        return false;
    }

    const newCourses = new Set<string>();
    const courseToCountry: Record<string, string> = {};
    const courseLengths: Record<string, number> = {};
    const courseElevations: Record<string, number> = {};
    const settersThisSeason = new Set<string>();
    
    setsData.forEach(r => {
        const cName = r["Course"] || r["COURSE"];
        if (!cName) return;
        const dStr = r["Date set"] || r["TIMESTAMP"];
        let d = NaN;
        if (dStr && dStr.toUpperCase() !== "TBD") d = new Date(dStr + "T12:00:00Z").getTime();
        
        let cCountry = r["Country"] || r["COUNTRY"] || "";
        const cLength = parseFloat(r["Length (m)"] || "0") || 0;
        const cElev = parseFloat(r["Elevation (m)"] || r["Elevation Change (+/-)"] || "0") || 0;

        courseToCountry[cName.toUpperCase()] = cCountry;
        courseLengths[cName.toUpperCase()] = cLength;
        courseElevations[cName.toUpperCase()] = Math.abs(cElev);

        if (inWindow(d, "")) {
            newCourses.add(cName.toUpperCase());
            const setter = r["COURSE SETTERS Leads"] || r["Setter"] || r["Setters"] || "";
            if (setter) {
                setter.split(/,|\/| and /i).map(s => s.trim().toUpperCase()).filter(Boolean).forEach(s => settersThisSeason.add(s));
            }
        }
    });

    const activePlayers = new Set<string>();
    const malePlayers = new Set<string>();
    const femalePlayers = new Set<string>();
    
    const activeCourses = new Set<string>();
    let totalRuns = 0;
    
    const courseBests: Record<string, number> = {};
    liveData.forEach(r => {
        const cName = r["Course AUCOIN AUCOIN RINO CPRC 1 CHAPU 1 CHAPU 1 AURARIA 1 HARBOURFRONT 1"] || r["Course"] || r["COURSE"];
        if (!cName) return;
        const timeStr = r["Time (sec) ? ? ? ? ? ? ? ?"] || r["Time (sec)"] || r["TIME"];
        if (!timeStr || timeStr === "?") return;
        const time = parseFloat(timeStr);
        if (isNaN(time)) return;
        const cUpper = cName.toUpperCase();
        if (!courseBests[cUpper] || time < courseBests[cUpper]) {
            courseBests[cUpper] = time;
        }
    });

    let newCrRuns = 0;
    
    const courseRunCounts: Record<string, number> = {};
    const playerRunCounts: Record<string, number> = {};
    let totalMetersRan = 0;
    let totalElevationTackled = 0;
    let totalAggregateTime = 0;
    let totalFilmsSubmitted = 0;

    liveData.forEach(r => {
        const info = parseDateOrEvent(r);
        
        if (inWindow(info.d, info.event)) {
            totalRuns++;
            const pName = r["Player Taylor Carpenter Benati Louvouezo Taylor Carpenter Taylor Carpenter Taylor Carpenter Taylor Carpenter Joey Jepsen Joey Jepsen"] || r["Player"] || r["PLAYER"];
            if (pName && pName.toUpperCase() !== "TBD" && !pName.toUpperCase().startsWith("UNKNOWN")) {
                const upperPName = pName.toUpperCase();
                activePlayers.add(upperPName);
                playerRunCounts[upperPName] = (playerRunCounts[upperPName] || 0) + 1;
                
                const division = r["Division F M F F F F M M"] || r["Division"] || "";
                if (division.toUpperCase() === "M") malePlayers.add(upperPName);
                if (division.toUpperCase() === "F") femalePlayers.add(upperPName);
            }
            const cName = r["Course AUCOIN AUCOIN RINO CPRC 1 CHAPU 1 CHAPU 1 AURARIA 1 HARBOURFRONT 1"] || r["Course"] || r["COURSE"];
            
            const fp = r["Video proof "] || r["Video proof"] || "";
            if (fp && fp.includes("http")) {
                totalFilmsSubmitted++;
            }

            if (cName) {
                const upperCName = cName.toUpperCase();
                activeCourses.add(upperCName);
                courseRunCounts[upperCName] = (courseRunCounts[upperCName] || 0) + 1;
                
                if (courseLengths[upperCName]) {
                    totalMetersRan += courseLengths[upperCName];
                }

                if (courseElevations[upperCName]) {
                    totalElevationTackled += courseElevations[upperCName];
                }
                
                const timeStr = r["Time (sec) ? ? ? ? ? ? ? ?"] || r["Time (sec)"] || r["TIME"];
                if (timeStr && timeStr !== "?") {
                    const time = parseFloat(timeStr);
                    totalAggregateTime += time;
                    if (time === courseBests[upperCName]) {
                        newCrRuns++;
                    }
                }
            }
        }
    });

    const activeTeamsAndGyms = new Set<string>();

    athletesData.forEach(r => {
        const name = r["Name"] || r["Athlete"] || r["Player"];
        if (!name) return;
        const nUpper = name.toUpperCase();
        if (activePlayers.has(nUpper)) {
            const tA = r["Team"] || r["TEAM A"];
            const tB = r["TEAM B"];
            const hg = r["Home gym"] || r["Home Gym"];
            if (tA && tA.toUpperCase() !== "UNAFFILIATED") activeTeamsAndGyms.add(tA.toUpperCase());
            if (tB && tB.toUpperCase() !== "UNAFFILIATED") activeTeamsAndGyms.add(tB.toUpperCase());
            if (hg && hg.toUpperCase() !== "UNAFFILIATED") activeTeamsAndGyms.add(hg.toUpperCase());
        }
    });

    console.log("Total runs submitted:", totalRuns);
    console.log("Active players:", activePlayers.size);
    console.log("Male / Female players:", malePlayers.size, "/", femalePlayers.size);
    console.log("Active courses:", activeCourses.size);
    console.log("New courses set:", newCourses.size);
    console.log("New course records:", newCrRuns);
    
    console.log("--- Additional Community KPIs ---");
    console.log("Total displacement (distance ran):", totalMetersRan.toFixed(0), "m");
    console.log("Total vertical displacement (elevation change tackled):", totalElevationTackled.toFixed(0), "m");
    console.log("Total active time under tension across all athletes (seconds):", totalAggregateTime.toFixed(1), "s");
    console.log("Active Teams and Gyms represented:", activeTeamsAndGyms.size);
    console.log("Active course setters contributing new lines:", settersThisSeason.size);
    console.log("Videos submitted/audited:", totalFilmsSubmitted);
    console.log("Percentage of runs that broke a course record:", ((newCrRuns / totalRuns) * 100).toFixed(1) + "%");
}
main();
