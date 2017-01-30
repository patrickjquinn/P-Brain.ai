const request = require('co-request')

function * bitcoin_resp(query) {
    const bitcoin_url = 'https://blockchain.info/ticker'

    let data = yield request(bitcoin_url)
    let key = 'USD';
    
    data = JSON.parse(data.body)
    query = query.toUpperCase()
    
    if (query.indexOf('EURO') != -1){
    	key = 'EUR'
    } else if (query.indexOf('POUNDS') != -1){
    	key = 'GBP'
    }

    return 'The current Bitcoin price is '+data[key].symbol+data[key].last;
}

const intent = () => ({
    keywords: ['bitcoin'], module: 'bitcoin'
})

module.exports = {
    get: bitcoin_resp,
    intent
}
