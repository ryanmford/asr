import fs from "fs";

// Mock implementation of the points calculation to debug why the delta is identical

const runs = 90; // hypothetical runs for Ryan
const baseRating = 71.100;
const ptOriginalTime = 13.71; // his actual PR?
const oldCR = 11.71; 
const targetTimes = [13.71, 13.5, 11.71];

for (const targetTime of targetTimes) {
    const timesForCR = [11.88, 13.26]; // Just guessing
    timesForCR.push(targetTime);
    const simulatedCR = Math.min(...timesForCR);
    
    const oldCoursePts = Math.min(100, (oldCR / ptOriginalTime) * 100);
    const newCoursePts = targetTime > 0 ? Math.min(100, (simulatedCR / targetTime) * 100) : 0;
    
    const pointsDelta = newCoursePts - oldCoursePts;
    const newRating = baseRating + (pointsDelta / runs);
    
    console.log(`targetTime: ${targetTime}, oldPts: ${oldCoursePts}, newPts: ${newCoursePts}, delta: ${pointsDelta}, newRating: ${newRating}`);
}
