// App server

const fs = require('fs');
const express = require('express');
const path = require('path');
let https = require('https');
let http = require('http');

let httpsPort = 8443;
let httpPort = 8000;

const app = express();

let privateKey  = fs.readFileSync('./cube_key.key', 'utf8');
let certificate = fs.readFileSync('./cube_cert.pem', 'utf8');
let credentials = { key: privateKey, cert: certificate };
let httpsServer = https.createServer(credentials, app);

let httpServer = http.createServer(app);

app.use(express.static(path.join(__dirname, './root')));

httpsServer.listen(httpsPort, () => console.log('HTTPS Server is running on: https://localhost:%d', httpsPort));

httpServer.listen(httpPort, () => console.log('HTTP Server is running on: http://localhost:%d', httpPort));
