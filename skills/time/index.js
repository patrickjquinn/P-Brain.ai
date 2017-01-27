function * _intent() {
    return {keywords: ['what time is it', 'what is the time'], module: 'time'}
}

function * time_resp(query) {
    const time = new Date().toLocaleTimeString('en-GB', {hour: 'numeric',
        minute: 'numeric'})

    return 'It is ' + time
}

module.exports = {
    get: time_resp,
    intent: _intent
}
