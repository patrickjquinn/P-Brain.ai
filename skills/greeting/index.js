const co = require('co')

function * make_greeting(silent, user) {
    let name = yield global.db.getValue('personal_details', user, 'name')
    let greeting_name = ''
    if (name) {
        name = name.trim()
        if (name.includes(' ')) {
            greeting_name = `, ${name.split(' ')[0]}`
        } else {
            greeting_name = `, ${name}`
        }
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

function * registerClient(socket, user) {
    const greeting = yield make_greeting(true, user)
    socket.emit('response', {type: 'greeting', msg: greeting})
}

module.exports = {
    registerClient
}
