const config = require.main.require('./config/index.js').get
const request = require('co-request')
const co = require('co')

function * get_name() {
    const details_url = `http://localhost:${config.port}/api/skills/personal_details`
    let data = yield request(details_url)
    data = JSON.parse(data.body)
    return data.name
}

function * make_greeting(silent) {
    const name = yield get_name()
    let greeting_name = ''
    if (name) {
        greeting_name = `, ${name.split(' ')[0]}`
    }
    const dt = new Date().getHours()

    let response
    if (dt >= 0 && dt <= 11) {
        response = `Good Morning${greeting_name}!`
    } else if (dt >= 12 && dt <= 17) {
        response = `Good Afternoon${greeting_name}!`
    } else {
        response = `Good Evening${greeting_name}!`
    }
    return {text: response, silent}
}

function * registerClient(socket) {
    const greeting = yield make_greeting(true)
    socket.emit('response', {type: 'greeting', msg: greeting})
}

function * register(app, io) {
    app.get('/', (req, res) => {
        co(function * () {
            const greeting = yield make_greeting(false)
            res.json(greeting)
        }).catch(err => {
            console.log(err)
            res.status(503).send(err.message)
        })
    })
}

module.exports = {
    registerClient,
    register
}
