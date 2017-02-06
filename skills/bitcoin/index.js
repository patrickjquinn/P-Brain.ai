const request = require('co-request')

function * bitcoin_resp(query) {
    const bitcoin_url = 'https://blockchain.info/ticker'

    let data = yield request(bitcoin_url)
    let key = 'USD'

    data = JSON.parse(data.body)
    query = query.toUpperCase()

    if (query.indexOf('EURO') != -1) {
    	key = 'EUR'
    } else if (query.indexOf('POUNDS') != -1) {
    	key = 'GBP'
    }

    return {text: 'The current Bitcoin price is ' + data[key].symbol + data[key].last}
}

const intent = () => ({
    keywords: ['bitcoin'], module: 'bitcoin'
})

const examples = () => (
    ['Show me the current bitcoin value.', 'What\'s the bitcoin value?', 'Bitcoin value.']
)

module.exports = {
    get: bitcoin_resp,
    intent,
    examples
}
