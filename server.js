const co = require('co')
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const wrap = require('co-express')
const compression = require('compression')
const bodyParser = require('body-parser')
const fs = require('fs')
const ip = require('ip')
const search = require('./api/core-ask.js')
const skills = require('./skills/skills.js')
const authenticator = require('./authentication')
const config = require('./config/index.js').get
const jsonParser = bodyParser.urlencoded({ extended: false })
global.db = require('./sqlite_db')

app.use(compression({
    threshold: 0,
    level: 9,
    memLevel: 9
}))

app.use((req, res, next) => {
    req.connection.setNoDelay(true)
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'X-Requested-With')
    next()
})

// Don't bother with authentication for this.
app.use(express.static('./src'))

// TODO parse services in query
app.get('/api/ask', authenticator.filter, wrap(function * (req, res) {
    const input = req.query.q.toLowerCase()

    res.header('Content-Type', 'application/json')

    try {
        const user = yield authenticator.getUser(req)
        const result = yield search.query(input, user)
        res.send(result)
    } catch (e) {
        console.log(e)
        res.send({msg: {text: 'Sorry, I didn\'t understand ' + input}, type: 'error'})
    }
}))

app.get('/api/correct_last/:skill', authenticator.filter, wrap(function * (req, res) {
    const input = req.params.skill.toLowerCase()
    yield search.correct_last(input)
    res.json({text: 'Successfully re-trained.'})
}))

app.get('/api/login', authenticator.login);
app.get('/api/validate', authenticator.validate)
io.use(authenticator.verifyIO);

io.on('connect', socket => {
    socket.on('ask', co.wrap(function * (msg) {
        const user = yield global.db.getUserFromToken(socket.handshake.query.token)
        const input = msg.text.toLowerCase()
        try {
            const result = yield search.query(input, user)
            socket.emit('response', result)
        } catch (e) {
            console.log(e)
            socket.emit('response', {msg: {text: 'Sorry, I didn\'t understand ' + input}, type: 'error'})
        }
    }))
    co(function * () {
        const user = yield global.db.getUserFromToken(socket.handshake.query.token)
        yield skills.registerClient(socket, user)
    }).catch(err => {
        console.log(err)
        throw err
    })
})

const skillsApi = express()
skillsApi.all('/', authenticator.filter)
app.use('/api/skills', skillsApi)

function * initialSetup() {
    const port = yield global.db.getGlobalValue("port")
    if (!port) {
        console.log("Setting default values in database")
        yield global.db.setGlobalValue("port", 4567)
        const user = {
            username: 'demo',
            password: yield authenticator.encryptPassword('demo')
        }
        yield global.db.saveUser(user)
    }
}

co(function * () {
    console.log("Setting up database.")
    yield global.db.setup('pbrain.db')
    yield initialSetup()

    console.log("Loading skills.")
    yield skills.loadSkills(skillsApi, io)
    console.log("Training recognizer.")
    yield search.train_recognizer(skills.getSkills())
    console.log("Starting server.")
    const port = yield global.db.getGlobalValue("port")
    http.listen(port, () => {
        console.log(`Server started on http://localhost:${config.port}`)
    })
}).catch(err => {
    console.log(err)
    throw err
})
