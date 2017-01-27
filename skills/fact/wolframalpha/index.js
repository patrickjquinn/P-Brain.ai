const request = require('co-request')
const parser = require('xml2json')

let config = require('../../../config/'),
    keys = config.get

function * wlfra_resp(query) {
    const url = 'http://api.wolframalpha.com/v2/query?input=<query>&appid=' + keys.wolframalpha.key

    let data = yield request(url.replace('<query>', query))

    try {
        data = JSON.parse(parser.toJson(data.body))
    } catch (e) {
        if (e) {
            console.log('error parsing wolframalpha body ' + e)
        }
        return null
    }

    const pods = data.queryresult.pod

    let result = ''

    try {
        if (pods && pods.length && pods.length > 0) {
            for (var i = 0; i < pods.length; i++) {
                var index = pods[i]

                if (index.primary === 'true') {
                    result = index.subpod.plaintext
                    break
                }

                if (index.id == 'Result') {
                    result = index.subpod.plaintext
                    break
                }
            }

            if (result === '') {
                for (var i = 0; i < pods.length; i++) {
                    var index = pods[i]

                    if (index.title == 'Basic information') {
                        result = index.subpod.plaintext
                        break
                    }
                }
            }
        } else {
            return null
        }

        if (result.indexOf('|') != -1) {
            result = result.replaceAll(' |', ', ')
        }

        return result
    } catch (e) {
        console.log(e)
        return null
    }
}

module.exports = {
    get: wlfra_resp
}
