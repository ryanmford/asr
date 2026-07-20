import { fetchGoogleSheetCSV } from '../src/lib/asr-data';
import { CONFIG } from '../src/lib/asr-utils';

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

function parseDate(r: any) {
    const dStr = r["Date "] || r["Date"] || r["TIMESTAMP"] || r["Timestamp"];
    if (!dStr) return null;
    const cleanD = dStr.replace(/\?|\s/g, '');
    if (cleanD.length >= 8) return new Date(cleanD + "T12:00:00Z");
    return null;
}

async function main() {
    const liveFeedCSV = await fetchGoogleSheetCSV(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_GIDS.LIVE);
    const mensCSV = await fetchGoogleSheetCSV(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_GIDS.MENS);
    const womensCSV = await fetchGoogleSheetCSV(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_GIDS.WOMENS);

    const liveData = parseCSV(liveFeedCSV);
    const athletesData = [...parseCSV(mensCSV), ...parseCSV(womensCSV)];

    const athleteGender = {};
    athletesData.forEach(r => {
        const name = (r["Name"] || r["Athlete"] || r["Player"] || "").trim().toUpperCase();
        if (name) {
            athleteGender[name] = r["Gender"] || r["Division"] || (mensCSV.includes(r["Name"]) ? "M" : "F"); // Approximation
        }
    });

    const allTimeRecords = { M: {}, F: {} };
    const player2026Bests = { M: {}, F: {} };

    liveData.forEach(r => {
        const pName = (r["Player Taylor Carpenter Benati Louvouezo Taylor Carpenter Taylor Carpenter Taylor Carpenter Taylor Carpenter Joey Jepsen Joey Jepsen"] || r["Player"] || r["PLAYER"] || "").trim().toUpperCase();
        const cName = (r["Course AUCOIN AUCOIN RINO CPRC 1 CHAPU 1 CHAPU 1 AURARIA 1 HARBOURFRONT 1"] || r["Course"] || r["COURSE"] || "").trim().toUpperCase();
        const timeStr = r["Time (sec) ? ? ? ? ? ? ? ?"] || r["Time (sec)"] || r["TIME"];
        const div = (r["Division F M F F F F M M"] || r["Division"] || athleteGender[pName] || "M").trim().toUpperCase();
        const d = parseDate(r);
        
        if (!pName || pName.startsWith("UNKNOWN") || pName === "TBD" || !cName || !timeStr || timeStr === "?") return;
        
        const time = parseFloat(timeStr);
        if (isNaN(time)) return;

        const gender = div.startsWith("F") || div.startsWith("W") ? "F" : "M";

        // All time records
        if (!allTimeRecords[gender][cName] || time < allTimeRecords[gender][cName]) {
            allTimeRecords[gender][cName] = time;
        }

        // 2026 bests
        if (d && d.getFullYear() === 2026) {
            if (!player2026Bests[gender][pName]) player2026Bests[gender][pName] = {};
            if (!player2026Bests[gender][pName][cName] || time < player2026Bests[gender][pName][cName]) {
                player2026Bests[gender][pName][cName] = time;
            }
        }
    });

    for (const gender of ["M", "F"]) {
        console.log(`\n--- 2026 Rankings for ${gender} ---`);
        const results = [];
        
        for (const pName in player2026Bests[gender]) {
            const courses = player2026Bests[gender][pName];
            const courseNames = Object.keys(courses);
            
            if (courseNames.length >= 1) {
                let totalLQ = 0;
                for (const cName of courseNames) {
                    const best = courses[cName];
                    const cr = allTimeRecords[gender][cName];
                    const lq = (cr / best) * 100;
                    totalLQ += lq;
                }
                const avgLQ = totalLQ / courseNames.length;
                results.push({ name: pName, courses: courseNames.length, lq: avgLQ });
            }
        }
        
        results.sort((a, b) => b.lq - a.lq);
        results.forEach((r, i) => {
            console.log(`${i+1}. ${r.name} - ${r.lq.toFixed(2)} (${r.courses} courses)`);
        });
    }
}

main().catch(console.error);
