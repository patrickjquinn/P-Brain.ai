const db = require('diskdb').connect('./db/memorybank', ['users'])

function create_user(details) {
    if (details.name && details.id) {
        const user = {
            id: details.id,
            avatar: details.avatar,
            name: {name: 'Brain'},
            personal_details: {name: details.name},
            responses: {},
            log: {}
        }
        try {
            db.users.save(user)
            return {status: 'OK', code: 200}
        } catch (err) {
            return {status: 'FAIL', code: 500, reason: err}
        }
    } else {
        let error_reason = 'missing'
        if (!details.id) {
            error_reason += ' id'
        }
        if (!details.name) {
            error_reason += ',name'
        }
        return {status: 'FAIL', code: 500, reason: error_reason}
    }
}

function get_user(token) {
    if (token) {
        try {
            const profile = db.users.find({id: token})
            return {status: 'OK', code: 200, body: profile}
        } catch (err) {
            return {status: 'FAIL', code: 500, reason: err}
        }
    } else {
        return {status: 'FAIL', code: 500, reason: 'a valid token is required'}
    }
}

module.exports = {
    create_user,
    get_user
}
