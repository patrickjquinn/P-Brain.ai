const express = require('express')
const app = express()
const wrap = require('co-express')
const compression = require('compression')
const fs = require('fs')
const ip = require('ip')

const search = require('./api/core-ask.js')

const address = 'var ip_addr ="' + ip.address() + '";'

fs.writeFile('./src/js/ip.js', address, err => {
    if (err) {
        return console.log(err)
    }
    console.log(ip.address())
})

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
        res.send({ msg: 'Sorry, I didnt understand ' + input, type: 'error' })
    }
}))

app.listen(4567)
console.log('http://localhost:4567')
