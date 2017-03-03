const co = require('co')

String.prototype.capitalize = function(lower) {
    return (lower ? this.toLowerCase() : this).replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); })
};

function hard_rule(query, breakdown) {
    return query.startsWith('call this device') || query.startsWith('this device is called') ||
            query.startsWith('on my') || query.startsWith('on the')
}

function * multi_resp(query, breakdown, user, token) {
    if (query.includes('call this device') || query.includes('this device is called')) {
        // Parse queries for setting the device name.
        let device = query.replace('call this device', '').replace('this device is called', '').trim()
        if (device.startsWith('my')) {
            device = device.replace('my', '')
        } else if (device.startsWith('the')) {
            device = device.replace('the', '')
        }
        device = device.trim().capitalize(true)
        const tokens = yield global.db.getUserTokens(user, {name: device})
        if (tokens.length > 0) {
            if (tokens[0].token == token.token) {
                return {text: `This device is already called ${device}.`}
            } else {
                return {text: `You already have a device called ${device}.`}
            }
        } else {
            token.name = device
            yield global.db.saveToken(user, token)
            return {text: `This device is now called ${device}.`}
        }
    } else if (query.startsWith('on my') || query.startsWith('on the')) {
        // Parse queries for running on another device.
        query = query.replace('on my', '').replace('on the', '').trim()
        const tokens = yield global.db.getUserTokens(user)
        let found_device = null
        // In this loop we check all of the users named devices to find the one with the longest name that is in the
        // query. That is the one we chose to run the command on.
        tokens.map((token) => {
            if (token.name) {
                if (query.startsWith(token.name.toLowerCase())) {
                    if (found_device == null || token.name.length > found_device.name.length) {
                        found_device = token
                    }
                }
            }
        })
        if (found_device) {
            const command = query.replace(found_device.name.toLowerCase(), '').trim()
            const data = yield global.query(command, user, found_device)
            global.sendToDevice(found_device, 'response', data)
            return {text: `Okay, running query on ${found_device.name}.`, silent: true}
        } else {
            return {text: `I'm sorry, I couldn't find a device by that name.`}
        }
    }

    throw new Error('Multi-device failed to parse query.')
}

const examples = () => (
    ['Call this device my laptop.', 'Call this device the TV.',
        'On my TV play Game Of Thrones', 'On the laptop tell me the time.']
)

module.exports = {
    get: multi_resp,
    hard_rule,
    examples
}
