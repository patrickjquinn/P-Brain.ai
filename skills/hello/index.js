function * hello_resp() {
    return {text: 'Hello World'}
}

const intent = () => ({
    keywords: ['hello world'], module: 'hello'
})

const examples = () => (
    ['Hello world!', 'Hello there world.']
)

module.exports = {
    get: hello_resp,
    intent,
    examples
}
