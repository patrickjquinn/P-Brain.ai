const md5 = require('md5')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const basicAuth = require('basic-auth')
const co = require('co')

const clients = []

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

function filterNoNewToken(req, res, next) {
    filter(req, res, next, true)
}

function filter(req, res, next, no_new_token = false) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required (default demo and demo)');
        return res.sendStatus(401);
    }

    co(function * () {
        // If there's a token cookies then use that instead of username/password combo.
        let token = req.query.token
        if (!token) {
            token = req.cookies.token
        }
        if (token) {
            const user = yield global.db.getUserFromToken(token.trim())
            if (user) {
                req.user = user
                req.token = token.trim()
                return next()
            }
        }

        const basicUser = basicAuth(req);
        if (basicUser && basicUser.name && basicUser.pass) {
            const encryptedPass = yield encryptPassword(basicUser.pass)
            const user = yield global.db.getUser(basicUser.name, encryptedPass)
            if (user) {
                if (!no_new_token) {
                    const secret = yield getSecret()
                    const token = jwt.sign(user, secret).trim()
                    yield global.db.addToken(user, token)
                    res.cookie('token', token, {maxAge: 900000})
                    req.token = token
                }

                req.user = user
                next()
            } else {
                unauthorized(res)
            }
        } else {
            unauthorized(res)
        }
    }).catch(err => {
        console.log(err)
        res.status(503).json(err)
    })
}

function login(req, res) {
    filter(req, res, function() {
        res.json({token: req.token})
    })
}

function validate(req, res) {
    res.sendStatus(200)
}

function verifyIO(socket, next) {
    let token = socket.handshake.query.token
    if (token) {
        co(function * () {
            const user = yield global.db.getUserFromToken(token.trim())
            if (user) {
                clients.push({ user: user, token: token, socket: socket})
                socket.on('disconnect', function() {
                    for (let i = 0; i < clients.length; i++) {
                        if (clients[i].socket === socket) {
                            clients.splice(i, 1)
                            break
                        }
                    }
                })
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

function getSocketsByUser(user) {
    const sockets = []
    clients.map(function (client) {
        if (client.user.user_id == user.user_id) {
            sockets.push(client.socket)
        }
    })
    return sockets
}

module.exports = {
    verifyIO,
    filter,
    filterNoNewToken,
    login,
    validate,
    encryptPassword,
    getSocketsByUser
}
