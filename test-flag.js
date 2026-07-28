const flag = '🇺🇸';
console.log([...flag].map(s => s.codePointAt(0).toString(16)).join('-'));
