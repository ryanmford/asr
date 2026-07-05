import https from 'https';

const fetchCsv = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        if (res.headers.location) {
          fetchCsv(res.headers.location).then(resolve).catch(reject);
          return;
        }
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(data); });
    }).on('error', reject);
  });
};

const main = async () => {
  const mensUrl = 'https://docs.google.com/spreadsheets/d/1DcLZyAO2QZij_176vsC7_rWWTVbxwt8X9Jw7YWM_7j4/export?format=csv&gid=595214914';
  const womensUrl = 'https://docs.google.com/spreadsheets/d/1DcLZyAO2QZij_176vsC7_rWWTVbxwt8X9Jw7YWM_7j4/export?format=csv&gid=566627843';
  
  const mensCsv = await fetchCsv(mensUrl);
  const womensCsv = await fetchCsv(womensUrl);
  
  const parseRows = (csv: string) => {
    const lines = csv.split('\n');
    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const runsIdx = header.findIndex(h => h === 'runs' || h === 'totalruns' || h === 'total' || h === '#');
    const nameIdx = header.findIndex(h => h === 'athlete' || h === 'name' || h === 'player');
    
    if (runsIdx === -1 || nameIdx === -1) return [];
    
    return lines.slice(1).map(line => {
      const parts = line.split(',');
      if (parts.length <= Math.max(runsIdx, nameIdx)) return null;
      const name = parts[nameIdx].replace(/"/g, '').trim();
      const runsStr = parts[runsIdx].replace(/"/g, '').trim();
      const runs = parseInt(runsStr, 10);
      if (!name || isNaN(runs)) return null;
      return { name, runs };
    }).filter(x => x !== null) as {name: string, runs: number}[];
  };

  const mens = parseRows(mensCsv);
  const womens = parseRows(womensCsv);
  
  const all = [...mens, ...womens];
  const over10 = all.filter(p => p.runs >= 10).sort((a, b) => b.runs - a.runs);
  
  console.log(JSON.stringify(over10, null, 2));
};

main().catch(console.error);
