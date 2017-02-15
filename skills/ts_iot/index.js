const request = require('co-request')
const util = require('util')

// The first substitute is expected to by the device name, all lower case,
// no punctuation and spaces replaced with underscores, such as 'bedroom_light'.
// The second substitute is the command, this module assumes there is an 'on', 'off' and 'state' command.
// On success the server returns { state: 'on' } and on failure error will be set { error: 'Failure' }.
const IOT_URL = 'http://192.168.2.4:42238/devices/%s/methods/%s'

function * do_iot(device, state) {
    let data = yield request(util.format(IOT_URL, device, state))
    data = JSON.parse(data.body)
    if (data.error) {
        console.log(`IoT Error: ${data.error} - ${device} - ${state}`)
        return {text: `I'm sorry, I can't turn the ${device} ${state}.`}
    } else if (state == 'state') {
        return {text: `The ${device} is ${data.state}.`}
    }
    return {text: `Turning the ${device} ${state}.`}
}

function hard_rule(query, breakdown) {
    if (query.startsWith('turn on the') || query.startsWith('turn off the')) {
        return true
    }
    if (query.startsWith('turn the') && (query.includes('on') || query.includes('off'))) {
        return true
    }
    if (query.startsWith('is the') && query.endsWith('on')) {
        return true
    }
    return false
}

function * iot_resp(query) {
    let state = null
    let device = null

    const words = query.split(' ')
    // Parse the query with the form 'Turn on the light.'.
    if (query.startsWith('turn on the') || query.startsWith('turn off the')) {
        state = words[1]
        device = query.replace(`turn ${state} the`, '').trim()
    } else if (query.startsWith('turn the')) { // Parse the query with the form 'Turn the light on.'.
        if (words.length > 3) {
            state = words[words.length - 1]
            const stateIndex = query.lastIndexOf(state)
            device = query.substring(0, stateIndex).replace('turn the', '').trim()
        }
    } else if (query.startsWith('is the')) { // Parse the form 'Is the light on?'.
        if (words.length > 3) {
            state = 'state'
            const stateIndex = query.lastIndexOf('on')
            device = query.substring(0, stateIndex).replace('is the', '').trim()
        }
    }

    if (device.length == 0) {
        return {text: `I'm sorry, I couldn't find the device in your query.`}
    }
    if (state != 'on' && state != 'off' && state != 'state') {
        return {text: `I'm sorry, I don't understand your query.`}
    }

    device = device.split(' ').join('_')

    const response = yield do_iot(device, state)
    return response
}

const examples = () => (
    ['Turn on the light.', 'Turn the light off.', 'Is the light on?']
)

module.exports = {
    get: iot_resp,
    hard_rule,
    examples
}
