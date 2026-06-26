import { fetchGoogleSheetCSV, processLiveFeedData } from '../src/lib/asr-data';
import { CONFIG } from '../src/lib/asr-utils';
import { parse } from 'csv-parse/sync';

async function main() {
  const liveCsv = await fetchGoogleSheetCSV(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_GIDS.LIVE);
  
  // We can just parse the CSV manually to get the raw data and find the best time for each course/gender
  const lines = liveCsv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim());
    
  let hIdx = -1;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (/athlete|name|course|track|pb|result/i.test(lines[i])) {
      hIdx = i;
      break;
    }
  }
  
  const headers = lines[hIdx].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
  
  // Actually processLiveFeedData handles finding the AT course records. 
  // Let's use it.
  const data = processLiveFeedData(liveCsv);
  
  // data.allTimeLeaderboards: { M: { course: { pKey: numericValue } } }
  // data.atRawBest: { pKey: { course: { num: number, videoUrl: string, label: string } } }
  
  // For each course, find the absolute best time for men and women
  const crs = [];
  
  for (const gender of ['M', 'F']) {
    const courses = Object.keys(data.allTimeLeaderboards[gender] || {});
    for (const c of courses) {
      const times = data.allTimeLeaderboards[gender][c];
      let bestTime = Infinity;
      let bestKey = '';
      
      for (const [pKey, time] of Object.entries(times)) {
        if ((time as number) < bestTime) {
          bestTime = time as number;
          bestKey = pKey;
        }
      }
      
      if (bestKey) {
        // find the video URL for this run.
        const run = data.atRawBest[bestKey][c];
        crs.push({
          gender,
          course: c,
          athlete: bestKey,
          time: bestTime,
          videoUrl: run.videoUrl,
        });
      }
    }
  }
  
  // filter crs that don't have "youtube.com" or "youtu.be"
  const nonYt = crs.filter(cr => {
    if (cr.athlete.toLowerCase().includes('interimtoptime')) return false;
    const url = cr.videoUrl || '';
    return !url.includes('youtube.com') && !url.includes('youtu.be');
  });
  
  console.log(`Found ${nonYt.length} records without YouTube:`);
  nonYt.forEach((cr, index) => {
    console.log(`${index + 1}. ${cr.gender} - ${cr.course} - ${cr.athlete} - ${cr.time} - URL: ${cr.videoUrl}`);
  });
}

main().catch(console.error);
