const natural = require('natural')

const intent = () => ({
    keywords: ['trip to qqqq'],
    module: 'trip'
})

const isHobbit = query =>
    query.includes('mordor') || query.includes('tomorrow')

function * tripResponse(query) {
    return {text: isHobbit(query) ?
        'One does not simply walk into Mordor.' :
        `Sorry, I dont understand ${query}`}
}

module.exports = {
    get: tripResponse,
    intent
}
