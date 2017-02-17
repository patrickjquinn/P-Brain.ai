const request = require('co-request')
const wolfram = require('wolfram-alpha')
let client = null

function * query_wrapper(query) {
    return new Promise(function (resolve, reject) {
        client.query(query, function(err, result) {
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

function * register() {
    if ((yield global.db.getSkillValue('fact', 'wolframalpha')) == null) {
        console.log('Setting default API key for Wolfram Alpha')
        yield global.db.setSkillValue('fact', 'wolframalpha', 'U7L4VR-K3WJPLK6Y2')
    }
    client = wolfram.createClient(yield global.db.getSkillValue('fact', 'wolframlpha'))
}

module.exports = {
    get: wlfra_resp,
    register
}
