const md5 = require('md5')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const basicAuth = require('basic-auth')
const config = require.main.require('./config/index.js').get

const USERS_FILE = "config/users.json"

let users = []
const authenticated = []

function filter(req, res, next) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.sendStatus(401);
    };
  
    var user = basicAuth(req);
    if (isUserValid(user.name, user.pass)) {
        next()
    } else {
        return unauthorized(res)
    }
}

function isUserValid(user, pass) {
    if (!user || !pass || user.length == 0 || pass.length == 0) {
        return null
    }
    pass = md5(pass + config.auth.static_salt).toUpperCase()
    if (users.length <= 0) {
        if (!loadUsers()) {
            return null
        }
    }
    for (let i = 0; i < users.length; i++) {
        if (users[i].username == user && users[i].password == pass) {
            return users[i]
        }
    }
    return null
}

function authenticate(username, pass) {
    const user = isUserValid(username, pass)
    if (user) {
        var token = jwt.sign(user, config.auth.jwtSecret)
        authenticated.push({
            id: user.id,
            token: token.trim()
        })
        return {token: token.trim() }
    }
    return null
}

function getTokenId(token) {
    for (let i = 0; i < authenticated.length; i++) {
        if (authenticated[i].token == token) {
            return authenticated[i].id
        }
    }
    return null
}

function verifyIO(socket, next) {
    let token = socket.handshake.query.token
    if (!token) {
        next(new Error('No token supplied'))
    } else {
        jwt.verify(token, config.auth.jwtSecret, function(err, decoded) {
            if (err) {
                next(new Error('Token not valid'))
            } else if (getTokenId(token) != null) {
                next()
            } else {
                next(new Error('Token not found'))
            }
        });
    }
}

function verifyToken(token) {
    try {
        jwt.verify(token, config.auth.jwtSecret)
    } catch (err) {
        return false
    }
    return getTokenId(token) != null
}

function loadUsers() {
    try {
        users = JSON.parse(fs.readFileSync(USERS_FILE))
    } catch (err) {
        // Ignore and use the default name.
        console.log("Failed to load users file.")
        console.log(err)
        return false
    }
    return true
}

module.exports = {
  authenticate,
  verifyIO,
  verifyToken,
  filter
}
