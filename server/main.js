const express = require('express')
const fs = require('fs')
const fileUpload = require('express-fileupload')
const auth = require('basic-auth')
const rimraf = require('rimraf')
const path = require('path')
const config = require('./env')

// ----------------------------------------------------------------------------------------------------------------

const app = express()

app.use('/../client/static', express.static(__dirname + '/public'))
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

app.use((req, res, next) => {

  const protectedRoutes = ['/', '/upload']
  if (!protectedRoutes.includes(req.path)) {
    next()
    return
  }

  var credentials = auth(req)

  if (!credentials || credentials.name !== config.uploadCredentials.username || credentials.pass !== config.uploadCredentials.password) {
    res.status(401)
    res.header('WWW-Authenticate', 'Basic realm="example"')
    res.send('Access denied')
  } else {
    next()
  }
})

app.get('/', (req, res) => {
  res.send(fs.readFileSync(path.join(__dirname + '/../client/index.html')).toString().replace(/\[API_URL]/g, config.serverBaseUrl))
})

app.post('/upload', (req, res) => {
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
        const logMessage = `Destroyed upload with slug "${randomDirSlug}" (had ${ttlInMinutes} minutes to live.)`
        writeToLog(logMessage)
        console.log(logMessage)
      }, ttlInMinutes * 60000)
      res.send(fs.readFileSync(path.join(__dirname + '/../client/uploaded.html')).toString().replace('[URL]', url))
    })
  }
)

app.get('/download/:slug', async (req, res) => {
  const dir = __dirname + '/uploads/' + req.params.slug
  try {
    const file = fs.readdirSync(dir)[0]
    writeToLog(`User downloaded file "${file}"`)
    console.log(`User downloaded file "${file}"`)
    res.sendFile(dir + '/' + file)
  } catch (e) {
    res.status(404).send('URL has expired.')
  }
})

destroyAll()
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
