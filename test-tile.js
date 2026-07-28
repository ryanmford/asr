const https = require('https');
https.get('https://a.basemaps.cartocdn.com/dark_all/15/1000/1000.png', (res) => {
  console.log('Status:', res.statusCode);
});
