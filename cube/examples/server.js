const express = require('express')
var path = require('path');
const app = express()
const port = 8000

app.use(express.static(path.join(__dirname, './')))

app.listen(port, () => console.log(`Example server listening on port ${port}!`))
