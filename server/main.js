const express = require('express')
const fs = require('fs')
const fileUpload = require('express-fileupload')
const basicAuth = require('express-basic-auth')
const rimraf = require('rimraf')
const path = require('path')
const config = require('./env')

// ----------------------------------------------------------------------------------------------------------------

const app = express()

app.use(fileUpload())

const port = 4444

const logFilePath = __dirname + '/logs.txt'
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, '')
}

const writeToLog = (message) => {
  const timestamp = new Date().toDateString()
  fs.appendFileSync(logFilePath, `${timestamp}: ${message}\n`)
}

const destroyAll = () => {
  rimraf(__dirname + '/uploads/**/*', () => {
    const message = 'Destroyed all files because of boot.'
    writeToLog(message)
    console.log(message)
  })
}

// ----------------------------------------------------------------------------------------------------------------

const userCredentials = {
  adminUsername: config.uploadCredentials.username,
  adminPassword: config.uploadCredentials.password
}

const authUsersObject = {
  users: {
    [userCredentials.adminUsername]: userCredentials.adminPassword,
  },
  challenge: true,
  realm: 'Imb4T3st4pp',
}

// return console.log(JSON.stringify(authUsersObject, null, 2))

app.get('/', basicAuth({
  authUsersObject
}), (req, res) => res.sendFile(path.join(__dirname + '/../client/index.html')))

app.post('/upload', basicAuth({
  authUsersObject
}), (req, res) => {
  const ttlInMinutes = Number(req.body.ttlInMinutes ? req.body.ttlInMinutes : 1)
  const file = req.files.file
  const randomDirSlug = 'x-' + Math.round(Math.random() * 99999999999)
  const directory = __dirname + '/uploads/' + randomDirSlug
  fs.mkdir(directory)
  file.mv(directory + '/' + file.name, (err) => {
    if (err) {
      return res.status(500).send(err)
    }
    const url = `http://localhost:${port}/download/${randomDirSlug}`
    writeToLog(`Received and saved a file to "${directory + file.name}" with ${ttlInMinutes} minutes to live.`)
    setTimeout(() => {
      fs.unlinkSync(directory + '/' + file.name)
      fs.rmdirSync(directory)
      writeToLog(`Destroyed upload with slug "${randomDirSlug}" (had ${ttlInMinutes} minutes to live.)`)
    }, ttlInMinutes * 60000)
    res.send(fs.readFileSync(path.join(__dirname + '/../client/uploaded.html')).toString().replace('[URL]', url))
  })
})

app.get('/download/:slug', (req, res) => {
  const dir = __dirname + '/uploads/' + req.params.slug
  try {
    const file = fs.readdirSync(dir)[0]
    writeToLog(`User downloaded file "${file}"`)
    res.sendFile(dir + '/' + file)
  } catch (e) {
    res.status(404).send('URL has expired.')
  }
})

destroyAll()
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
