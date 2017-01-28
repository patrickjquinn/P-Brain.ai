const request = require('co-request')

const intent = () => ({
    keywords: ['what is status', 'what is the status', 'check status', 'what is the status of qqqq', 'web api'],
    module: 'status'
})

// where i pee
// happy
// web copy

function * get(query) {
    const serviceUrl = 'https://web-api.migros.ch/isalive'

    let data = yield request(serviceUrl)

    const { status } = JSON.parse(data.body)

    return status
}

module.exports = {
    get,
    intent
}

