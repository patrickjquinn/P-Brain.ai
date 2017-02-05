function * rick_resp() {
    return {id: 'dQw4w9WgXcQ', text: 'I just wanna tell you how I\'m feeling.'}
}

const intent = () => ({
    keywords: ['Rick Astley'], module: 'rick'
})

const examples = () => (
    ['Who\'s Rick Astley?', 'Never gonna give you up.']
)

module.exports = {
    get: rick_resp,
    intent,
    examples
}
