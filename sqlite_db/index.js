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
    'CREATE TABLE IF NOT EXISTS user_settings(user_id INTEGER REFERENCES users(user_id), skill TEXT NOT NULL, key TEXT NOT NULL, value TEXT, PRIMARY KEY(user_id, skill, key));'

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
                resolve(row)
            }
        })
    })
}

function * saveUser(user) {
    const dbuser = yield getUserFromName(user.username)
    return new Promise((resolve, reject) => {
        if (dbuser) {
            db.run('UPDATE users SET username=?,password=? WHERE user_id=?', user.username, user.password, dbuser.user_id, err => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        } else {
            db.run('INSERT INTO users(username, password) VALUES(?, ?)', user.username, user.password, err => {
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

function * getValue(skill, user, key) {
    return new Promise((resolve, reject) => {
        db.get('SELECT value FROM user_settings WHERE skill = ? AND user_id = ? AND key = ?', skill, user.user_id, key, (err, row) => {
            if (err) {
                reject(err)
            } else if (row) {
                resolve(JSON.parse(row.value))
            } else {
                resolve(undefined)
            }
        })
    })
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
    return new Promise((resolve, reject) => {
        db.get('SELECT value FROM skill_settings WHERE skill = ? AND key = ?', skill, key, (err, row) => {
            if (err) {
                reject(err)
            } else if (row) {
                resolve(JSON.parse(row.value))
            } else {
                resolve(undefined)
            }
        })
    })
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
    return new Promise((resolve, reject) => {
        db.get('SELECT value FROM global_settings WHERE key = ?', key, (err, row) => {
            if (err) {
                reject(err)
            } else if (row) {
                resolve(JSON.parse(row.value))
            } else {
                resolve(undefined)
            }
        })
    })
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

function * getUserFromToken(token) {
    return new Promise((resolve, reject) => {
        db.get('SELECT users.* FROM users INNER JOIN tokens ON tokens.user_id=users.user_id WHERE tokens.token = ?', token, (err, row) => {
            if (err) {
                reject(err)
            } else {
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

/* co(function * () {
    const val = yield getUserFromName("demo")
    console.log(val)
    val.password = 'new_password'
    yield saveUser(val)

    yield setValue('timer', val, 'setting1', { val: 'value1'})
    console.log(yield getValue('timer', val, 'setting1'))
    yield setSkillValue('timer', 'setting1', { val: 'value1'})
    console.log(yield getSkillValue('timer', 'setting1'))
    yield setGlobalValue('setting1', { val: 'value1'})
    console.log(yield getGlobalValue('setting1'))

    yield addToken(val, "sdkjhfksdhfkjsdhfkjsdhf")
    console.log(yield getUserFromToken("sdkjhfksdhfkjsdhfkjsdhf"))
    yield addToken(val, "76853746tiuhsdfgjh")
    console.log(yield getUserTokens(val))
}).catch(err => {
    console.log(err)
    throw err
}) */

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
    getUserFromToken,
    getUser,
    saveUser,
    getUserTokens,
    addQuery,
    addResponse
}
