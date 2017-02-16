const co = require('co')

const sqlite3 = require('sqlite3').verbose()
let db = null

const setupQuery =
    'CREATE TABLE IF NOT EXISTS users(user_id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL);' +
    'CREATE TABLE IF NOT EXISTS tokens(token TEXT PRIMARY KEY, timestamp INT DEFAULT (strftime(\'%s\',\'now\')), user_id INTEGER REFERENCES users(user_id));' +
    'CREATE TABLE IF NOT EXISTS queries(query_id INTEGER PRIMARY KEY, query TEXT NOT NULL, timestamp INT DEFAULT (strftime(\'%s\',\'now\')), user_id INTEGER REFERENCES users(user_id));' +
    'CREATE TABLE IF NOT EXISTS responses(query_id INTEGER PRIMARY KEY REFERENCES queries(query_id), response TEXT NOT NULL, skill TEXT NOT NULL);' +
    'CREATE TABLE IF NOT EXISTS global_settings(key TEXT PRIMARY KEY, value TEXT);' +
    'CREATE TABLE IF NOT EXISTS skill_settings(skill TEXT NOT NULL, key TEXT NOT NULL, value TEXT, PRIMARY KEY(skill, key));' +
    'CREATE TABLE IF NOT EXISTS user_settings(user_id INTEGER REFERENCES users(user_id), skill TEXT NOT NULL, key TEXT NOT NULL, value TEXT, PRIMARY KEY(user_id, skill, key));' +
    'CREATE TABLE IF NOT EXISTS version(version INTEGER);'

function * getVersion() {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM version LIMIT 1', (err, row) => {
            if (err) {
                reject(err)
            } else {
                if (row) {
                    resolve(row.version)
                } else {
                    resolve(0)
                }
            }
        })
    })
}

function * setVersion(version) {
    return new Promise((resolve, reject) => {
        db.get('INSERT OR REPLACE INTO version(version) VALUES (?)', version, (err, row) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

function * databaseV1Setup() {
    return new Promise((resolve, reject) => {
        db.run('ALTER TABLE users ADD is_admin INTEGER DEFAULT 0', (err) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

function * setup(database) {
    return new Promise((resolve, reject) => {
        db = new sqlite3.cached.Database(database, err => {
            if (err) {
                console.log(`Failed to open database. ${err}`)
                reject(err)
            } else {
                db.exec(setupQuery, err => {
                    if (err) {
                        reject(err)
                    } else {
                        co(function * () {
                            const version = yield getVersion()
                            switch(version) {
                                case 0:
                                    yield databaseV1Setup()
                                    yield setVersion(1)
                                default: break
                            }
                        }).catch(err => {
                            reject(err)
                        })
                        resolve()
                    }
                })
            }
        })
    })
}

function * getUserFromName(username) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', username, (err, row) => {
            if (err) {
                reject(err)
            } else {
                if (row) {
                    row.is_admin = row.is_admin == 1
                }
                resolve(row)
            }
        })
    })
}

function * saveUser(user) {
    const dbuser = yield getUserFromName(user.username)
    const is_admin = (user.is_admin) ? user.is_admin : 0
    return new Promise((resolve, reject) => {
        if (dbuser) {
            db.run('UPDATE users SET username=?,password=?,is_admin=? WHERE user_id=?', user.username, user.password, is_admin, dbuser.user_id, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        } else {
            db.run('INSERT INTO users(username, password, is_admin) VALUES(?, ?, ?)', user.username, user.password, is_admin, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        }
    })
}

function * getUser(username, password) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ? AND password = ?', username, password, (err, row) => {
            if (err) {
                reject(err)
            } else {
                if (row) {
                    row.is_admin = row.is_admin == 1
                }
                resolve(row)
            }
        })
    })
}

function * setValue(skill, user, key, value) {
    value = JSON.stringify(value)
    return new Promise((resolve, reject) => {
        db.get('INSERT OR REPLACE INTO user_settings(skill, user_id, key, value) VALUES (?, ?, ?, ?)', skill, user.user_id, key, value, (err, row) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

function makeConditionalQuery(query, conditions, values) {
    const endConditions = []
    const endValues = []
    for (let i = 0; i < conditions.length; i++) {
        if (values[i] != undefined && values[i] != null) {
            endConditions.push(conditions[i])
            endValues.push(values[i])
        }
    }
    for (let i = 0; i < endConditions.length; i++) {
        if (i == 0) {
            query = `${query} WHERE ${endConditions[i]}`
        } else {
            query = `${query} AND ${endConditions[i]}`
        }
    }
    return {query: query, values: endValues}
}

function * allQueryWrapper(query, values, key) {
    return new Promise((resolve, reject) => {
        db.all(query, values, (err, rows) => {
            if (err) {
                reject(err)
            } else {
                if (Array.isArray(rows) && rows.length > 0) {
                    rows.map((row) => {
                        row.value = JSON.parse(row.value)
                    })
                    if (key) {
                        resolve(rows[0].value)
                    } else {
                        resolve(rows)
                    }
                } else {
                    resolve(undefined)
                }
            }
        })
    })
}

function * getValue(skill, user, key) {
    const base = 'SELECT skill, users.username, key, value FROM user_settings INNER JOIN users ON users.user_id = user_settings.user_id'
    let user_id = (user) ? user.user_id : undefined
    const query = makeConditionalQuery(base, ['skill = ?', 'user_settings.user_id = ?', 'key = ?'], [skill, user_id, key])
    return yield allQueryWrapper(query.query, query.values, key)
}

function * setSkillValue(skill, key, value) {
    value = JSON.stringify(value)
    return new Promise((resolve, reject) => {
        db.get('INSERT OR REPLACE INTO skill_settings(skill, key, value) VALUES (?, ?, ?)', skill, key, value, (err, row) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

function * getSkillValue(skill, key) {
    const base = 'SELECT skill, key, value FROM skill_settings'
    const query = makeConditionalQuery(base, ['skill = ?', 'key = ?'], [skill, key])
    return yield allQueryWrapper(query.query, query.values, key)
}

function * setGlobalValue(key, value) {
    value = JSON.stringify(value)
    return new Promise((resolve, reject) => {
        db.get('INSERT OR REPLACE INTO global_settings(key, value) VALUES (?, ?)', key, value, (err, row) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

function * getGlobalValue(key) {
    const base = 'SELECT key, value FROM global_settings'
    const query = makeConditionalQuery(base, ['key = ?'], [key])
    return yield allQueryWrapper(query.query, query.values, key)
}

function * addToken(user, token) {
    return new Promise((resolve, reject) => {
        db.get('INSERT OR REPLACE INTO tokens(token, user_id) VALUES (?, ?)', token, user.user_id, (err, row) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

function * deleteToken(token) {
    return new Promise((resolve, reject) => {
        db.get('DELETE FROM tokens WHERE token = ?', token, (err, row) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

function * deleteUserTokens(user) {
    return new Promise((resolve, reject) => {
        db.get('DELETE FROM tokens WHERE user_id = ?', user.user_id, (err, row) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

function * getUserFromToken(token) {
    return new Promise((resolve, reject) => {
        db.get('SELECT users.* FROM users INNER JOIN tokens ON tokens.user_id=users.user_id WHERE tokens.token = ?', token, (err, row) => {
            if (err) {
                reject(err)
            } else {
                if (row) {
                    row.is_admin = row.is_admin == 1
                }
                resolve(row)
            }
        })
    })
}

function * getUserTokens(user) {
    return new Promise((resolve, reject) => {
        db.all('SELECT token, timestamp FROM tokens WHERE user_id = ?', user.user_id, (err, rows) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        })
    })
}

function * addQuery(query, user) {
    return new Promise((resolve, reject) => {
        query = JSON.stringify(query)
        db.run('INSERT INTO queries(query, user_id) VALUES(?, ?)', query, user.user_id, function (err) {
            if (err) {
                reject(err)
            } else {
                // lastId +1 because row IDs start at 0 and SQL IDs start at 1.
                resolve({query_id: this.lastId + 1, query, user})
            }
        })
    })
}

function * addResponse(query, skill, response) {
    return new Promise((resolve, reject) => {
        response = JSON.stringify(response)
        db.run('INSERT INTO responses(query_id, skill, response) VALUES(?, ?, ?)', query.query_id, skill, response, err => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

module.exports = {
    setup,
    setValue,
    getValue,
    setSkillValue,
    getSkillValue,
    setGlobalValue,
    getGlobalValue,
    addToken,
    deleteToken,
    deleteUserTokens,
    getUserFromToken,
    getUser,
    getUserFromName,
    saveUser,
    getUserTokens,
    addQuery,
    addResponse
}
