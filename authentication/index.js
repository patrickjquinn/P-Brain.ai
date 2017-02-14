const md5 = require('md5')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const basicAuth = require('basic-auth')
const co = require('co')

function * getStaticSalt() {
    let salt = yield global.db.getGlobalValue("static_salt")
    if (!salt) {
        salt = md5(`${Math.random()}${Date.now()}`)
        yield global.db.setGlobalValue("static_salt", salt)
    }
    return salt
}

function * getSecret() {
    let secret = yield global.db.getGlobalValue("jwtsecret")
    if (!secret) {
        secret = md5(`${Math.random()}${Date.now()}`)
        yield global.db.setGlobalValue("jwtsecret", secret)
    }
    return secret
}

function * encryptPassword(password) {
    const salt = yield getStaticSalt()
    return md5(password + salt).toUpperCase()
}

function filter(req, res, next) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.sendStatus(401);
    }
  
    const basicUser = basicAuth(req);
    co(function * () {
        const encryptedPass = yield encryptPassword(basicUser.pass)
        const user = yield global.db.getUser(basicUser.name, encryptedPass)
        if (user) {
            next()
        } else {
            unauthorized(res)
        }
    }).catch(err => {
        res.status(503).json(err)
    })
}

function login(req, res) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.sendStatus(401);
    }

    const basicUser = basicAuth(req);
    co(function * () {
        const encryptedPass = yield encryptPassword(basicUser.pass)
        const user = yield global.db.getUser(basicUser.name, encryptedPass)
        if (user) {
            const secret = yield getSecret()
            const token = jwt.sign(user, secret).trim()
            yield global.db.addToken(user, token)
            return res.json({ token: token})
        } else {
            unauthorized(res)
        }
    }).catch(err => {
        res.status(503).json(err)
    })
}

function validate(req, res) {
    const token = req.query.token
    if (token) {
        co(function *() {
            const user = yield global.db.getUserFromToken(token.trim())
            if (user) {
                res.sendStatus(200)
            } else {
                res.sendStatus(401)
            }
        }).catch(err => {
            res.status(503).json(err)
        })
    } else {
        res.sendStatus(401)
    }
}

function verifyIO(socket, next) {
    let token = socket.handshake.query.token
    if (token) {
        co(function * () {
            const user = yield global.db.getUserFromToken(token.trim())
            if (user) {
                next()
            } else {
                next(new Error('Token not found'))
            }
        }).catch(err => {
            next(new Error(err))
        })
    } else {
        next(new Error('No token supplied'))
    }
}

module.exports = {
    verifyIO,
    filter,
    login,
    validate,
    encryptPassword
}
