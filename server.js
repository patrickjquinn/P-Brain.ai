const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const wrap = require('co-express')
const compression = require('compression')
const fs = require('fs')
const ip = require('ip')
const co = require('co')

const search = require('./api/core-ask.js')
const skills = require('./skills/skills.js')
const config = require('./config/index.js').get

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

app.use(express.static('./src'))

// TODO parse services in query
app.get('/api/ask', wrap(function *(req, res) {
    const input = req.query.q.toLowerCase()

    res.header('Content-Type', 'application/json')

    try {
        const result = yield search.query(input)
        res.send(result)
    } catch (e) {
        console.log(e)
        res.send({ 'msg': {'text':'Sorry, I didnt understand ' + input}, type: 'error' })
    }
}))

app.get('/api/correct_last/:skill', wrap(function *(req, res) {
    const input = req.params.skill.toLowerCase();
    yield search.correct_last(input)
    res.json({text: "Successfully re-trained."})
}))

io.on('connect', function(socket){
    socket.on('ask', co.wrap(function *(msg){
        const input = msg.text.toLowerCase()
        try {
            const result = yield search.query(input)
            socket.emit('response', result);
        } catch (e) {
            socket.emit('response', { 'msg': {'text':'Sorry, I didnt understand ' + input}, type: 'error' });
        }
    }));
    co(function * () {
        yield skills.registerClient(socket)
    }).catch(err => {
        console.log(err)
        throw err
    })

})

const skillsApi = express();
app.use('/api/skills', skillsApi);

co(function * () {
    yield skills.loadSkills(skillsApi, io);
    yield search.train_recognizer(skills.getSkills());
}).catch(err => {
    console.log(err);
    throw err;
})

http.listen(config.port)
console.log(`Server started on http://localhost:${config.port}`)
