function * hello_resp() {
    return {text: 'Hello World'}
}

const intent = () => ({
    keywords: [], module: 'hello'
})

const examples = () => (
    []
)

module.exports = {
    get: hello_resp,
    intent,
    examples
}
