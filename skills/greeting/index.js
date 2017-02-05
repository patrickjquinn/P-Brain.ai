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

function registerClient(socket) {
    socket.emit('response', {type: "greeting", msg: make_greeting(true)})
}

module.exports = {
    registerClient
}
