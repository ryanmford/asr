const fs = require('fs');
let content = fs.readFileSync('src/components/views/HomeView.tsx', 'utf8');

// 1. Move Featured Section
const featuredStart = "{/* Featured Section */}";
const recentActivityStart = "{/* Recent Activity */}";

const fIndex = content.indexOf(featuredStart);
const rIndex = content.indexOf(recentActivityStart);

if (fIndex > -1 && rIndex > -1 && fIndex < rIndex) {
  const featuredCode = content.slice(fIndex, rIndex);
  content = content.slice(0, fIndex) + content.slice(rIndex);
  
  // Insert it before Unified Stats & Navigation Cards
  const statsStart = "{/* Unified Stats & Navigation Cards */}";
  const sIndex = content.indexOf(statsStart);
  if (sIndex > -1) {
    content = content.slice(0, sIndex) + featuredCode + "\n      " + content.slice(sIndex);
  }
}

// 2. Modify topCourse
content = content.replace(
  "topCourse: sortedCourses.length > 0 ? sortedCourses[0] : null,",
  "topCourse: sortedCourses.find((c) => c.name.toUpperCase().includes(\"FUNDA\")) || (sortedCourses.length > 0 ? sortedCourses[0] : null),"
);

fs.writeFileSync('src/components/views/HomeView.tsx', content);
