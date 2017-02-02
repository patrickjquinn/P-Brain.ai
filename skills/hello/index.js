function * hello_resp() {
    return 'Hello World'
}

const intent = () => ({
    keywords: ['hello world'], module: 'hello'
})

module.exports = {
    get: hello_resp,
    intent
}
