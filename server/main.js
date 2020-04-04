const express = require('express')
const fs = require('fs')
require('express-fileupload')
const path = require('path')

const app = express()
const port = 4444

app.get('/', (req, res) => res.sendFile(path.join(__dirname + '/../client/index.html')))

app.post('/upload', function(req, res) {
  console.log(req.files.foo); // the uploaded file object
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
