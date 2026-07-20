import { fetchGoogleSheetCSV, processRankingData } from '../src/lib/asr-data';
import { CONFIG, csvToObjects, cleanNumeric, normalizeName, isPlaceholderPlayer } from '../src/lib/asr-utils';

const LIVE_FEED_MAPPING = {
  athlete: ["athlete", "name", "player"],
  course: ["course", "track", "level"],
  result: ["result", "time", "pb"],
  gender: ["div", "gender", "sex"],
  date: ["date", "day", "timestamp"],
  tag: ["tag", "event", "category", "season"],
};

async function main() {
    const liveFeedCSV = await fetchGoogleSheetCSV(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_GIDS.LIVE);
    const mensCSV = await fetchGoogleSheetCSV(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_GIDS.MENS);
    const womensCSV = await fetchGoogleSheetCSV(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_GIDS.WOMENS);
    
    // Process athlete metadata just to get gender
    const pM = processRankingData(mensCSV, "M");
    const pF = processRankingData(womensCSV, "F");
    const athleteMetadata = {};
    pM.forEach(p => athleteMetadata[p.pKey] = { ...p, gender: "M" });
    pF.forEach(p => athleteMetadata[p.pKey] = { ...p, gender: "F" });

    // Parse Live Feed
    const lines = liveFeedCSV.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
    let hIdx = -1;
    for (let i = 0; i < Math.min(10, lines.length); i++) {
        if (/athlete|name|course|track|pb|result/i.test(lines[i])) {
            hIdx = i;
            break;
        }
    }
    const dataRows = csvToObjects(liveFeedCSV, LIVE_FEED_MAPPING, hIdx);

    const allTimeRecords = { M: {}, F: {} };
    const player2026Bests = { M: {}, F: {} };
    
    dataRows.forEach((vals) => {
        const pName = (vals.athlete || "").trim();
        const rawCourse = (vals.course || "").trim();
        const numericValue = cleanNumeric(vals.result);
        if (!pName || pName.toUpperCase().startsWith("UNKNOWN") || isPlaceholderPlayer(pName) || !rawCourse || numericValue === null) return;
        
        const rawGenderValue = (vals.gender || "").toUpperCase().trim();
        const baseKey = normalizeName(pName);
        const pGender = athleteMetadata[baseKey]?.gender || (rawGenderValue.startsWith("W") || rawGenderValue.startsWith("F") ? "F" : "M");
        
        const normC = rawCourse.toUpperCase();
        
        // Update all-time records
        if (!allTimeRecords[pGender][normC] || numericValue < allTimeRecords[pGender][normC]) {
            allTimeRecords[pGender][normC] = numericValue;
        }
    });

    dataRows.forEach((vals) => {
        const pName = (vals.athlete || "").trim();
        const rawCourse = (vals.course || "").trim();
        const numericValue = cleanNumeric(vals.result);
        if (!pName || pName.toUpperCase().startsWith("UNKNOWN") || isPlaceholderPlayer(pName) || !rawCourse || numericValue === null) return;
        
        const rawGenderValue = (vals.gender || "").toUpperCase().trim();
        const baseKey = normalizeName(pName);
        const pGender = athleteMetadata[baseKey]?.gender || (rawGenderValue.startsWith("W") || rawGenderValue.startsWith("F") ? "F" : "M");
        
        const normC = rawCourse.toUpperCase();
        
        // Check if run is in 2026
        let is2026 = false;
        const tag = (vals.tag || "").toUpperCase();
        if (tag.includes("OPEN") || tag.includes("2026") || tag.includes("ASR")) {
            is2026 = true; // Assume ASR tag or OPEN tag means current year
        } else if (vals.date) {
            const dateStr = String(vals.date).trim();
            if (dateStr.includes("2026") || dateStr.includes("/26") || dateStr.match(/^\d{1,2}\/\d{1,2}$/) || dateStr.match(/^\d{1,2}-\d{1,2}$/)) { 
                is2026 = true;
            } else {
                const d = new Date(dateStr);
                if (!isNaN(d.getTime()) && d.getFullYear() === 2026) is2026 = true;
            }
        }
        
        if (is2026) {
            if (!player2026Bests[pGender][baseKey]) player2026Bests[pGender][baseKey] = {};
            if (!player2026Bests[pGender][baseKey][normC] || numericValue < player2026Bests[pGender][baseKey][normC]) {
                player2026Bests[pGender][baseKey][normC] = numericValue;
            }
        }
    });
    
    for (const gender of ["M", "F"]) {
        console.log(`\n--- 2026 Season Rankings for ${gender} ---`);
        const results = [];
        
        for (const pKey in player2026Bests[gender]) {
            const courses = player2026Bests[gender][pKey];
            const courseNames = Object.keys(courses);
            
            if (courseNames.length >= 5) {
                let totalLQ = 0;
                for (const cName of courseNames) {
                    const best = courses[cName];
                    const cr = allTimeRecords[gender][cName];
                    const lq = (cr / best) * 100;
                    totalLQ += lq;
                }
                const avgLQ = totalLQ / courseNames.length;
                const meta = athleteMetadata[pKey];
                const displayName = meta ? meta.name : pKey;
                
                results.push({ name: displayName, courses: courseNames.length, lq: avgLQ });
            }
        }
        
        results.sort((a, b) => b.lq - a.lq);
        results.forEach((r, i) => {
            console.log(`${i+1}. ${r.name.padEnd(20)} - ${r.lq.toFixed(2)} (${r.courses} courses)`);
        });
        if (results.length === 0) console.log("No athletes qualified.");
    }
}

main().catch(console.error);
