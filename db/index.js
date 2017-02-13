const db = require('diskdb').connect('./db/memorybank', ['users','responses','queries','tokens','global'])

function add_user(details) {
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

function get_user_from_token(token) {
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

function get_user(username, password){

}

function add_token() {

}

function remove_token() {

}

function set_global_value(key,value){
    if (key && value){
        let pair = {'key':key,'value':value}

        try {
            db.global.save(pair);
            return {status: 'OK', code: 200}
        } catch (err) {
            return {status: 'FAIL', code: 500, reason: err}
        } 
    }
    return {status: 'FAIL', code: 500, reason: 'a valid key and value are required'}
}

function get_global_value(key){
    if (key) {
        try {
            let value = db.global.find({'key':key})
            return {status: 'OK', code: 200, body: value}
        } catch (err){
            return {status: 'FAIL', code: 500, reason: err}
        }
    }
    return {status: 'FAIL', code: 500, reason: 'a valid key is required'}
}

module.exports = {
    add_user,
    get_user,
    get_global_value,
    set_global_value,
    add_token,
    remove_token
}
