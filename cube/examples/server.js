const express = require('express');
var path = require('path');
var fs = require('fs');
var https = require('https');

var options = {
    cert: fs.readFileSync(path.join(__dirname, 'server.cer')),
    key:  fs.readFileSync(path.join(__dirname, 'server.key'))
};

const app = express();
const port = 8000;
const sslPort = 4430;

app.use(express.static(path.join(__dirname, './')));

app.listen(port, () => console.log(`Example server listening on port ${port}!`));

https.createServer(options, app).listen(sslPort, () => console.log(`Example server listening on SSL port ${sslPort}!`));
