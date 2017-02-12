const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const wrap = require('co-express')
const compression = require('compression')
const fs = require('fs')
const ip = require('ip')
const co = require('co')
const basicAuth = require('basic-auth')

const search = require('./api/core-ask.js')
const skills = require('./skills/skills.js')
const config = require('./config/index.js').get
const authenticator = require('./authentication')

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
        const result = yield search.query(input)
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

app.get('/api/login', function (req, res) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.sendStatus(401);
    };
  
    var user = basicAuth(req);
  
    const token = authenticator.authenticate(user.name, user.pass)
    if (token) {
        return res.json(token)
    } else {
        return unauthorized(res)
    }
});

app.get('/api/validate', function (req, res) {
    const token = req.query.token
    if (token) {
        if (authenticator.verifyToken(token.trim())) {
            res.sendStatus(200)
        } else {
            res.sendStatus(401)
        }
    } else {
        res.sendStatus(401)
    }
});

io.use(authenticator.verifyIO);

io.on('connect', socket => {
    socket.on('ask', co.wrap(function * (msg) {
        const input = msg.text.toLowerCase()
        try {
            const result = yield search.query(input)
            socket.emit('response', result)
        } catch (e) {
            console.log(e)
            socket.emit('response', {msg: {text: 'Sorry, I didn\'t understand ' + input}, type: 'error'})
        }
    }))
    co(function * () {
        yield skills.registerClient(socket)
    }).catch(err => {
        console.log(err)
        throw err
    })
})

const skillsApi = express()
skillsApi.all('/', authenticator.filter)
app.use('/api/skills', skillsApi)

co(function * () {
    console.log("Loading skills.")
    yield skills.loadSkills(skillsApi, io)
    console.log("Training recognizer.")
    yield search.train_recognizer(skills.getSkills())
    console.log("Starting server.")
    http.listen(config.port, () => {
        console.log(`Server started on http://localhost:${config.port}`)
    })
}).catch(err => {
    console.log(err)
    throw err
})
