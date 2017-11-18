const co = require('co')
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http, {'pingInterval': 2000, 'pingTimeout': 7000})
const wrap = require('co-express')
const compression = require('compression')
const fs = require('fs')
const ip = require('ip')
const search = require('./api/core-ask.js')
const skills = require('./skills/skills.js')
const settingsApi = require('./api/settings.js')
const usersApi = require('./api/users.js')
const cookieParser = require('cookie-parser')
global.auth = require('./authentication')
const Database = require('./db')

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

app.use(cookieParser())

app.use('/', [global.auth.filter(true), express.static('./src')])
app.use('/api/settings', [global.auth.filter(false), settingsApi])
app.use('/api/users', [global.auth.filter(false), usersApi])
app.get('/api/user', global.auth.filter(false), wrap(function * (req, res) {
    res.json(req.user)
}))
app.get('/api/token', global.auth.filter(false), wrap(function * (req, res) {
    res.json(req.token)
}))

// TODO parse services in query
app.get('/api/ask', global.auth.filter(false), wrap(function * (req, res) {
    const input = req.query.q.toLowerCase()

    try {
        const result = yield search.query(input, req.user, req.token)
        res.json(result)
    } catch (e) {
        console.log(e)
        res.json({msg: {text: 'Sorry, I didn\'t understand ' + input}, type: 'error'})
    }
}))

app.get('/api/login', global.auth.login)
app.get('/api/logout/:user?', [global.auth.filter(false), global.auth.logout])
app.get('/api/tokens/:user?', [global.auth.filter(false), global.auth.viewTokens])
app.get('/api/validate', [global.auth.filter(false), global.auth.validate])
io.use(global.auth.verifyIO)

io.on('connect', socket => {
    co(function *() {
        socket.on('ask', co.wrap(function *(msg) {
            try {
                const result = yield search.query(msg, socket.user, socket.token)
                socket.emit('response', result)
            } catch (e) {
                console.log(e)
                socket.emit('response', {msg: {text: 'Sorry, I didn\'t understand ' + msg.text.toLowerCase()}, type: 'error'})
            }
        }))
        yield skills.registerClient(socket, socket.user)
    }).catch(err => {
        console.log(err)
    })
})

function * initialSetup() {
    if ((yield global.db.getGlobalValue('port')) == null) {
        console.log('Setting default global values in database')
        yield global.db.setGlobalValue('port', 4567)
        yield global.db.setGlobalValue('promiscuous_mode', true)
        yield global.db.setGlobalValue('promiscuous_admins', true)
    }
}

co(function * () {
    console.log('Setting up database.')
    global.db = yield Database.setup()
    yield initialSetup()

    global.sendToUser = function (user, type, message) {
        const sockets = global.auth.getSocketsByUser(user)
        sockets.map(socket => {
            socket.emit(type, message)
        })
    }
    global.sendToDevice = function(token, type, message) {
        const socket = global.auth.getSocketByToken(token)
        if (socket) {
            socket.emit(type, message)
        } else {
            console.log("Failed to send to device: " + JSON.stringify(token))
        }
    }

    console.log('Loading skills.')
    yield skills.loadSkills()
    console.log('Training recognizer.')
    yield search.train_recognizer(skills.getSkills())
    console.log('Starting server.')
    const port = yield global.db.getGlobalValue('port')
    http.listen(port, () => {
        console.log(`Server started on http://localhost:${port}`)
    })

    const promiscuous = yield global.db.getGlobalValue('promiscuous_mode')
    const promiscuous_admins = yield global.db.getGlobalValue('promiscuous_admins')
    if (promiscuous) {
        console.log('Warning! Promiscuous mode is enabled all logins will succeed.')
        if (promiscuous_admins) {
            console.log('Possibly deadly warning! Promiscuous admins is enabled.' +
                ' All new users will be admins and can view each others data.')
        }
        console.log(`Settings can be changed at http://localhost:${port}/settings.html`)
    }
}).catch(err => {
    console.log(err)
    throw err
})
