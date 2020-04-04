const express = require('express')
const fs = require('fs')
const fileUpload = require('express-fileupload')

const path = require('path')

const app = express()
app.use(fileUpload())

const port = 4444

app.get('/', (req, res) => res.sendFile(path.join(__dirname + '/../client/index.html')))

app.post('/upload', function(req, res) {
  console.log('Got a file?')
  JSON.stringify(req.files, null, 2)
  res.json({files: req.files})
  // console.log(req.files.file); // the uploaded file object
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
