function * coin_resp() {
    const state = (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails'

    return {'text':'It\'s ' + state};
}

const intent = () => ({
    keywords: ['heads or tails', 'flip a coin', 'toss a coin'], module: 'coin'
})

module.exports = {
    get: coin_resp,
    intent
}
