const intent = () => ({
    keywords: ['hi q', 'hello q'],
    module: 'greeting'
})

function make_greeting(silent) {
    const dt = new Date().getHours();

    let response;
    if (dt >= 0 && dt <= 11) {
        response = 'Good Morning!'
    } else if (dt >= 12 && dt <= 17) {
        response = 'Good Afternoon!'
    } else {
        response = 'Good Evening!'
    }
    return {text: response, silent: silent}
}

function * fact_resp(query) {
    return make_greeting(false)
}

function registerClient(socket) {
    socket.emit('response', {type: "greeting", msg: make_greeting(true)})
}

module.exports = {
    get: fact_resp,
    intent,
    registerClient
}
