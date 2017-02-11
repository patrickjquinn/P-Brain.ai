const request = require('co-request')
const config = require.main.require('./config').get
const wolfram = require('wolfram-alpha').createClient(config.wolframalpha.key)

function * query_wrapper(query) {
    return new Promise(function (resolve, reject) {
        wolfram.query(query, function(err, result) {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}

function * wlfra_resp(query) {
    try {
        const result = yield(query_wrapper(query))
        for (let i = 0; i < result.length; i++) {
            if (result[i].primary) {
                return result[i].subpods[0].text
            }
        }
        return "I'm sorry, I didn't understand that."
    } catch (err) {
        console.log(err)
        return "I'm sorry, I didn't understand that."
    }
}

module.exports = {
    get: wlfra_resp
}
