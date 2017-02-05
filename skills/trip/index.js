const natural = require('natural')

const intent = () => ({
    keywords: ['trip to qqqq'],
    module: 'trip'
})

const examples = () => (
    ['Let\'s go on a trip.', 'Let\'s go to Mordor.']
)

const isHobbit = query =>
    query.includes('mordor') || query.includes('tomorrow')

function * tripResponse(query) {
    return {text: isHobbit(query) ?
        'One does not simply walk into Mordor.' :
        `Sorry, I dont understand ${query}`}
}

module.exports = {
    get: tripResponse,
    intent,
    examples
}
