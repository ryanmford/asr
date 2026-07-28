import { computeAllState } from './src/lib/asr-data-compute.ts';
import fs from 'fs';

const mensCsv = fs.readFileSync('public/data/mens.csv', 'utf8');
const womensCsv = fs.readFileSync('public/data/womens.csv', 'utf8');
const liveCsv = fs.readFileSync('public/data/live.csv', 'utf8');
const setsCsv = fs.readFileSync('public/data/sets.csv', 'utf8');

const data = computeAllState({ rM: mensCsv, rF: womensCsv, live: liveCsv, sets: setsCsv });
const cMetKeys = Object.keys(data.cMet);
console.log('Courses:', cMetKeys.length);
let withCoords = 0;
for (const k of cMetKeys) {
  if (data.cMet[k].parsedCoords) withCoords++;
}
console.log('With coords:', withCoords);
const sample = data.cMet[cMetKeys[0]];
console.log('Sample course coords:', sample.parsedCoords);
