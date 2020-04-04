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
  const file = req.files.file
  const directory = __dirname + '/uploads/x-' + Math.round(Math.random() * 99999999999)
  fs.mkdir(directory)
  file.mv(directory + '/' + file.name, (err) => {
    if (err) {
      return res.status(500).send(err)
    }
    res.send('File uploaded!')
  })
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
