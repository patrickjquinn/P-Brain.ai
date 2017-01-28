const request = require('co-request')

const intent = () => ({
    keywords: ['tell me a joke', 'say something funny', 'make me laugh'],
    module: 'joke'
})

function * joke_resp(query) {
    const joke_url = 'https://api.chucknorris.io/jokes/random'

    let data = yield request(joke_url)

    data = JSON.parse(data.body)

    return data.value
}

module.exports = {
    get: joke_resp,
    intent
}
