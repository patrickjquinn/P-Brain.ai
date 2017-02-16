const md5 = require('md5')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const basicAuth = require('basic-auth')
const co = require('co')

const clients = []

function * getStaticSalt() {
    let salt = yield global.db.getGlobalValue('static_salt')
    if (!salt) {
        salt = md5(`${Math.random()}${Date.now()}`)
        yield global.db.setGlobalValue('static_salt', salt)
    }
    return salt
}

function * getSecret() {
    let secret = yield global.db.getGlobalValue('jwtsecret')
    if (!secret) {
        secret = md5(`${Math.random()}${Date.now()}`)
        yield global.db.setGlobalValue('jwtsecret', secret)
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

function filter(newToken) {
    return (req, res, next) => {
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

            const basicUser = basicAuth(req)
            if (basicUser && basicUser.name && basicUser.pass) {
                const encryptedPass = yield encryptPassword(basicUser.pass)
                const user = yield global.db.getUser(basicUser.name, encryptedPass)
                const hasUser = (yield global.db.getUserFromName(basicUser.name)) ? true : false
                const promiscuousMode = yield global.db.getGlobalValue('promiscuous_mode')
                if (user) {
                    if (newToken) {
                        const secret = yield getSecret()
                        const token = jwt.sign(user, secret).trim()
                        yield global.db.addToken(user, token)
                        res.cookie('token', token, {maxAge: 900000})
                        req.token = token
                    }

                    req.user = user
                    next()
                } else if (promiscuousMode && !hasUser && basicUser.name.length > 0 && basicUser.pass.length > 0) {
                    // If in promiscuous mode then allow user creation if the user does not exist.
                    const promiscuousAdmins = yield global.db.getGlobalValue('promiscuous_admins')
                    const new_user = {
                        username: basicUser.name,
                        password: encryptedPass,
                        is_admin: promiscuousAdmins ? true : false
                    }
                    console.log("Creating promiscuous user:")
                    console.log(new_user)
                    yield global.db.saveUser(new_user)
                    // Call into this function again to create a token and response.
                    filter(newToken)(req, res,next)
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
}

function login(req, res) {
    filter(true)(req, res, () => {
        res.json({token: req.token})
    })
}

function logout(req, res) {
    co(function * () {
        if (req.params.user) {
            const url_user = yield global.db.getUserFromName(req.params.user)
            if (url_user) {
                if (req.user.is_admin || req.user.user_id == url_user.user_id) {
                    yield global.db.deleteUserTokens(url_user)
                    res.send(`Successfully logged out all devices for ${url_user.username}`)
                } else {
                    res.status(401).send("Not authorized for this user")
                }
            } else {
                res.status(404).send("User not found")
            }
        } else if (req.token) {
            yield global.db.deleteToken(req.token)
            res.send("Successfully logged out this device")
        } else {
            res.send("No devices logged out")
        }
    }).catch(err => {
        console.log(err)
        res.status(503).json(err)
    })
}

function validate(req, res) {
    res.sendStatus(200)
}

function verifyIO(socket, next) {
    const token = socket.handshake.query.token
    if (token) {
        co(function * () {
            const user = yield global.db.getUserFromToken(token.trim())
            if (user) {
                clients.push({user, token, socket})
                socket.on('disconnect', () => {
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
    clients.map(client => {
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
    logout,
    validate,
    encryptPassword,
    getSocketsByUser
}
