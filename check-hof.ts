import { processLiveFeedData, processRankingData } from './src/lib/asr-data';

async function fetchGoogleSheetCSV(sheetId: string, gid: string): Promise<string> {
  const directUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const response = await fetch(directUrl);
  return response.text();
}

async function run() {
  const sheetId = "1DcLZyAO2QZij_176vsC7_rWWTVbxwt8X9Jw7YWM_7j4";
  const mensCSV = await fetchGoogleSheetCSV(sheetId, "595214914");
  const womensCSV = await fetchGoogleSheetCSV(sheetId, "566627843");
  const liveCSV = await fetchGoogleSheetCSV(sheetId, "623600169");
  
  const mensData = processRankingData(mensCSV, "M");
  const womensData = processRankingData(womensCSV, "F");
  
  const allPlayers = {};
  [...mensData, ...womensData].forEach(p => {
    allPlayers[p.pKey] = p;
  });

  const liveData = processLiveFeedData(liveCSV, allPlayers, {});
  
  const allTimeRankings = liveData.allTimeRankings;
  
  const affected = allTimeRankings.filter(p => p.runs >= 10 && p.courses < 10 && !p.name.toUpperCase().includes("PLACEHOLDER") && !p.name.toUpperCase().includes("UNKNOWN"));
  console.log("AFFECTED PLAYERS:", affected.map(p => ({ name: p.name, runs: p.runs, courses: p.courses })));
}

run().catch(console.error);
