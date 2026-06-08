const fetch = require('node-fetch'); // wait, fetch is not in Node 16 natively, I'll use http
const http = require('http');

http.get('http://localhost:3000/api/applicant.php?id=111111111V', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data));
});
