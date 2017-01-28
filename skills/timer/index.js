const WtoN = require('words-to-num')

const intent = () => ({
    keywords: ['set timer', 'set timer for qqqq'],
    module: 'timer'
})

function * timer_resp(query) {
    const time_to_set = query.split('for ')[1]

    let number = time_to_set.split(' ')[0]

    if (!number) {
        number = time_to_set
    }

    number = WtoN.convert(number)

    const unit = time_to_set.split(' ')[1]

    if (number) {
        return ':timer: ' + number + ' ' + unit
    } else {
        return 'Sorry, I dont understand ' + query
    }
}

module.exports = {
    get: timer_resp,
    intent
}
