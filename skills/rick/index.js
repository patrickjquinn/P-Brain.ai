function * rick_resp() {
    return {'text':'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
}

const intent = () => ({
    keywords: ['Rick Astley'], module: 'rick'
})

module.exports = {
    get: rick_resp,
    intent
}