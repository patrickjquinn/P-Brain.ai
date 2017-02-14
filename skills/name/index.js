const co = require('co')

function hard_rule(query, breakdown) {
    return query.includes("your name") || query.includes("youre called");
}

let DEFAULT_NAME = 'Brain'

function * getName(user) {
    try {
        const nametmp = yield global.db.getValue("name", user, "name")
        if (nametmp) {
            return nametmp
        }
    } catch (err) {
        // Ignore and use the default name.
    }
    return DEFAULT_NAME
}

function * name_resp(query, breakdown, user) {
    query = query.toLowerCase()
    let name = yield getName(user)
    if (query.includes('who') || query.includes('what')) {
        if (query.toLowerCase().includes('what') && query.toLowerCase().includes('are')) {
            return {text: `I'm called ${name}, your Brain.`, name}
        }
        return {text: `I'm called ${name}.`, name}
    }
    const words = query.split(' ')
    name = words[words.length - 1]
    name = name.charAt(0).toUpperCase() + name.slice(1)

    yield global.db.setValue("name", user, "name", name)

    global.sendToUser(user, 'set_name', {name})

    return {text: `You can now call me ${name}.`, name}
}

function * registerClient(socket, user) {
    socket.on('get_name', msg => {
        co(function * () {
            const name = yield getName(user)
            socket.emit('get_name', {name})
        }).catch(err => {
            console.log(err)
            throw err
        })
    })
    const name = yield getName(user)
    socket.emit('set_name', {name})
}

const examples = () => (
    ['Your name is Dave.']
)

module.exports = {
    get: name_resp,
    registerClient,
    hard_rule,
    examples
}
