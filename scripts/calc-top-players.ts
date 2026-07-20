import { fetchGoogleSheetCSV, processRankingData } from "../src/lib/asr-data";
import { CONFIG } from "../src/lib/asr-utils";

async function main() {
  const mensCsv = await fetchGoogleSheetCSV(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_GIDS.MENS);
  const womensCsv = await fetchGoogleSheetCSV(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_GIDS.WOMENS);
  
  const mens = processRankingData(mensCsv, "M");
  const womens = processRankingData(womensCsv, "F");
  
  const all = [...mens, ...womens];
  const top = all.filter(p => p && p.runs >= 10).sort((a, b) => b.runs - a.runs);
  
  for (const p of top) {
    console.log(`${p.name}: ${p.runs} runs`);
  }
}

main().catch(console.error);
