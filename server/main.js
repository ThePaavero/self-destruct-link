const express = require('express')
const fs = require('fs')
const fileUpload = require('express-fileupload')

const path = require('path')

const app = express()
app.use(fileUpload())

const port = 4444

app.get('/', (req, res) => res.sendFile(path.join(__dirname + '/../client/index.html')))

app.post('/upload', function(req, res) {
  const ttlInMinutes = Number(req.body.ttlInMinutes)
  console.log('ttlInMinutes:' + ttlInMinutes)
  const file = req.files.file
  const randomDirSlug = 'x-' + Math.round(Math.random() * 99999999999)
  const directory = __dirname + '/uploads/' + randomDirSlug
  fs.mkdir(directory)
  file.mv(directory + '/' + file.name, (err) => {
    if (err) {
      return res.status(500).send(err)
    }
    const url = `http://localhost:${port}/download/${randomDirSlug}`
    setTimeout(() => {
      fs.unlinkSync(directory + '/' + file.name)
      fs.rmdirSync(directory)
      console.log(`Destroyed upload with slug "${randomDirSlug}"`)
    }, ttlInMinutes * 60000)
    res.send(fs.readFileSync(path.join(__dirname + '/../client/uploaded.html')).toString().replace('[URL]', url))
  })
})

app.get('/download/:slug', (req, res) => {
  const dir = __dirname + '/uploads/' + req.params.slug
  try {
    const file = fs.readdirSync(dir)[0]
    res.sendFile(dir + '/' + file)
  } catch (e) {
    res.status(404).send('URL has expired.')
  }
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
