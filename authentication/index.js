const md5 = require('md5');
const jwt = require('jsonwebtoken');
const basicAuth = require('basic-auth');
const wrap = require('../api/wrap');

const clients = [];

async function getStaticSalt() {
    let salt = await global.db.getGlobalValue('static_salt');
    if (!salt) {
        salt = md5(`${Math.random()}${Date.now()}`);
        await global.db.setGlobalValue('static_salt', salt);
    }
    return salt;
}

async function getSecret() {
    let secret = await global.db.getGlobalValue('jwtsecret');
    if (!secret) {
        secret = md5(`${Math.random()}${Date.now()}`);
        await global.db.setGlobalValue('jwtsecret', secret);
    }
    return secret;
}

async function encryptPassword(password) {
    const salt = await getStaticSalt();
    return md5(password + salt).toUpperCase();
}

function filter(newToken) {
    return wrap(async (req, res, next) => {
        function unauthorized(res) {
            res.set(
                'WWW-Authenticate',
                'Basic realm=Authorization Required (default demo and demo)',
            );
            return res.sendStatus(401);
        }

        // If there's a token cookies then use that instead of username/password combo.
        let token = req.query.token;
        if (!token) {
            token = req.cookies.token;
        }
        try {
            token = JSON.parse(token);
        } catch (err) {
            // Ignore the error, string token.
        }
        if (token && token.token) {
            token = token.token;
        }
        if (token) {
            const user = await global.db.getUserFromToken({ token: token.trim() });
            if (user) {
                req.user = user;
                req.token = (await global.db.getUserTokens(user, { token: token.trim() }))[0];
                return next();
            }
        }

        const basicUser = basicAuth(req);
        if (basicUser && basicUser.name && basicUser.pass) {
            const encryptedPass = await encryptPassword(basicUser.pass);
            const user = await global.db.getUser({
                username: basicUser.name,
                password: encryptedPass,
            });
            const hasUser = !!(await global.db.getUser({ username: basicUser.name }));
            const promiscuousMode = await global.db.getGlobalValue('promiscuous_mode');
            if (user) {
                if (newToken === true) {
                    console.log(`Creating new token for user ${user.username}.`);
                    const secret = await getSecret();
                    const token = jwt.sign(user, secret).trim();
                    await global.db.saveToken(user, { token });
                    res.cookie('token', token, { maxAge: 10 * 365 * 24 * 60 * 60 }); // 10 years.
                    req.token = (await global.db.getUserTokens(user, { token: token.trim() }))[0];
                }

                req.user = user;
                next();
            } else if (
                promiscuousMode &&
                !hasUser &&
                basicUser.name.length > 0 &&
                basicUser.pass.length > 0
            ) {
                // If in promiscuous mode then allow user creation if the user does not exist.
                const promiscuousAdmins = await global.db.getGlobalValue('promiscuous_admins');
                const new_user = {
                    username: basicUser.name,
                    password: encryptedPass,
                    is_admin: !!promiscuousAdmins,
                };
                console.log(`Creating promiscuous user ${new_user.username}.`);
                await global.db.saveUser(new_user);
                // Call into this function again to create a token and response.
                filter(newToken)(req, res, next);
            } else {
                unauthorized(res);
            }
        } else {
            unauthorized(res);
        }
    });
}

function login(req, res) {
    filter(true)(req, res, () => {
        res.json({ token: req.token });
    });
}

function logout(req, res) {
    wrap(async (req, res) => {
        if (req.params.user) {
            const url_user = await global.db.getUser({ username: req.params.user });
            if (url_user) {
                if (req.user.is_admin || req.user.user_id == url_user.user_id) {
                    await global.db.deleteUserTokens(url_user);
                    res.send(`Successfully logged out all devices for ${url_user.username}`);
                } else {
                    res.status(401).send('Not authorized for this user');
                }
            } else {
                res.status(404).send('User not found');
            }
        } else if (req.token) {
            await global.db.deleteToken(req.token);
            res.send('Successfully logged out this device');
        } else {
            res.send('No devices logged out');
        }
    })(req, res);
}

function viewTokens(req, res) {
    wrap(async (req, res) => {
        if (req.params.user) {
            const url_user = await global.db.getUser({ username: req.params.user });
            if (url_user) {
                if (req.user.is_admin || req.user.user_id == url_user.user_id) {
                    res.json(await global.db.getUserTokens(url_user));
                } else {
                    res.status(401).send('Not authorized for this user');
                }
            } else {
                res.status(404).send('User not found');
            }
        } else {
            res.json(await global.db.getUserTokens(req.user));
        }
    })(req, res);
}

function validate(req, res) {
    res.sendStatus(200);
}

function verifyIO(socket, next) {
    let token = socket.handshake.query.token;
    try {
        token = JSON.parse(token);
    } catch (err) {
        // Ignore the error, string token.
    }
    if (token.token) {
        token = token.token;
    }
    if (token) {
        (async function() {
            const user = await global.db.getUserFromToken({ token: token.trim() });
            if (user) {
                const full_token = (
                    await global.db.getUserTokens(user, { token: token.trim() })
                )[0];
                socket.user = user;
                socket.token = full_token;
                clients.push({ user, token: full_token, socket });
                socket.on('disconnect', () => {
                    for (let i = 0; i < clients.length; i++) {
                        if (clients[i].socket === socket) {
                            clients.splice(i, 1);
                            break;
                        }
                    }
                });
                next();
            } else {
                next(new Error('Token not found'));
            }
        })().catch(err => {
            next(new Error(err));
        });
    } else {
        next(new Error('No token supplied'));
    }
}

function getSocketsByUser(user) {
    const sockets = [];
    clients.map(client => {
        if (client.user.user_id == user.user_id) {
            sockets.push(client.socket);
        }
    });
    return sockets;
}

function getSocketByToken(token) {
    for (let i = 0; i < clients.length; i++) {
        if (clients[i].token.token == token.token) {
            return clients[i].socket;
        }
    }
    return null;
}

module.exports = {
    verifyIO,
    filter,
    viewTokens,
    login,
    logout,
    validate,
    encryptPassword,
    getSocketsByUser,
    getSocketByToken,
};
