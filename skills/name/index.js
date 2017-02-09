const fs = require('fs')

const NAME_FILE = 'config/name.json'

function hard_rule(query, breakdown) {
    return query.includes("your name") || query.includes("youre called");
}

let name = 'Brain'
let socket_io = null

function * name_resp(query) {
    query = query.toLowerCase()
    if (query.includes('who') || query.includes('what')) {
        if (query.toLowerCase().includes('what') && query.toLowerCase().includes('are')) {
            return {text: `I'm called ${name}, your Brain.`, name, silent: true}
        } else {
            return {text: `I'm called ${name}.`, name, silent: true}
        }
    } else {
        const words = query.split(' ')
        name = words[words.length - 1]
        name = name.charAt(0).toUpperCase() + name.slice(1)

        fs.writeFile(NAME_FILE, JSON.stringify({name}, null, 2), err => {
            if (err) {
                return console.log(err)
            }
        })

        socket_io.emit('set_name', {name})

        return {text: `You can now call me ${name}.`, name, silent: true}
    }
}

function * register(app, io) {
    try {
        const nameJson = JSON.parse(fs.readFileSync(NAME_FILE))
        name = nameJson.name
    } catch (err) {
        // Ignore and use the default name.
    }
    app.get('/', (req, res) => {
        res.json({name})
    })
    socket_io = io
}

function * registerClient(socket) {
    socket.on('get_name', msg => {
        socket.emit('get_name', {name})
    })
    socket.emit('set_name', {name})
}

const examples = () => (
    ['Your name is Dave.']
)

module.exports = {
    get: name_resp,
    register,
    registerClient,
    hard_rule,
    examples
}
