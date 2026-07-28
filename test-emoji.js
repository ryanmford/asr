const segment = '📍';
console.log([...segment].map(s => s.codePointAt(0).toString(16)).join('-'));
const seg2 = '🔥';
console.log([...seg2].map(s => s.codePointAt(0).toString(16)).join('-'));
