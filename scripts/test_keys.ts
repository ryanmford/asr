import { parseASRData, getCourseList, getPlayerListOP } from "../src/lib/asr-data";
import fs from "fs";

const rawCsv = fs.readFileSync("live.csv", "utf-8");
parseASRData(rawCsv);
const courses = getCourseList("M");
const players = getPlayerListOP("M");

function checkDuplicates(data: any[], name: string) {
  const keys = new Set();
  const duplicates = new Set();
  data.forEach((item, index) => {
    const key = item.id || item.pKey || item.name || index;
    if (keys.has(key)) duplicates.add(key);
    keys.add(key);
  });
  console.log(`${name} total:`, data.length, "unique:", keys.size, "duplicates:", Array.from(duplicates));
}

checkDuplicates(courses, "Courses");
checkDuplicates(players, "Players");
