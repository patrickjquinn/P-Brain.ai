const sqlite3 = require('sqlite3').verbose();

const setupQuery =
    'CREATE TABLE IF NOT EXISTS users(user_id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL);' +
    "CREATE TABLE IF NOT EXISTS tokens(token TEXT PRIMARY KEY NOT NULL, timestamp INT DEFAULT (strftime('%s','now')), user_id INTEGER REFERENCES users(user_id));" +
    "CREATE TABLE IF NOT EXISTS queries(query_id INTEGER PRIMARY KEY, query TEXT NOT NULL, timestamp INT DEFAULT (strftime('%s','now')), user_id INTEGER REFERENCES users(user_id));" +
    'CREATE TABLE IF NOT EXISTS responses(query_id INTEGER PRIMARY KEY REFERENCES queries(query_id), response TEXT NOT NULL, skill TEXT NOT NULL);' +
    'CREATE TABLE IF NOT EXISTS global_settings(key TEXT PRIMARY KEY NOT NULL, value TEXT);' +
    'CREATE TABLE IF NOT EXISTS skill_settings(skill TEXT NOT NULL, key TEXT NOT NULL, value TEXT, PRIMARY KEY(skill, key));' +
    'CREATE TABLE IF NOT EXISTS user_settings(user_id INTEGER REFERENCES users(user_id), skill TEXT NOT NULL, key TEXT NOT NULL, value TEXT, PRIMARY KEY(user_id, skill, key));' +
    'CREATE TABLE IF NOT EXISTS version(version INTEGER);' +
    'INSERT OR IGNORE INTO version(version) VALUES (0)';

function makeConditionalQuery(query, conditions, values) {
    const endConditions = [];
    const endValues = [];
    for (let i = 0; i < conditions.length; i++) {
        if (values[i] != undefined && values[i] != null) {
            endConditions.push(conditions[i]);
            endValues.push(values[i]);
        }
    }
    for (let i = 0; i < endConditions.length; i++) {
        if (i == 0) {
            query = `${query} WHERE ${endConditions[i]}`;
        } else {
            query = `${query} AND ${endConditions[i]}`;
        }
    }
    return { query: query, values: endValues };
}

function exportUser(user) {
    if (user) {
        return {
            user_id: user.user_id,
            username: user.username,
            is_admin: user.is_admin == 1,
        };
    }
    return null;
}

function Database(sqlite_db) {
    this.db = sqlite_db;
}

Database.prototype.queryWrapper = async function(fn, query, values) {
    if (values) {
        fn = fn.bind(this.db, query, values);
    } else {
        fn = fn.bind(this.db, query);
    }
    return new Promise((resolve, reject) => {
        try {
            fn((err, rows) => {
                if (err) {
                    reject(
                        new Error(
                            `Error running query: ${query} - ${JSON.stringify(values)}: ${err}`,
                        ),
                    );
                } else {
                    resolve(rows);
                }
            });
        } catch (err) {
            reject(err);
        }
    });
};

Database.prototype.allQueryWrapper = async function(query, values, key) {
    const rows = await this.queryWrapper(this.db.all, query, values);
    if (Array.isArray(rows) && rows.length > 0) {
        rows.map(row => {
            row.value = JSON.parse(row.value);
        });
        if (key) {
            return rows[0].value;
        } else {
            return rows;
        }
    }
    return undefined;
};

Database.prototype.getVersion = async function() {
    const row = await this.queryWrapper(
        this.db.get,
        'SELECT * FROM version ORDER BY version DESC LIMIT 1',
    );
    return row.version;
};

Database.prototype.setVersion = async function(version) {
    await this.queryWrapper(this.db.run, 'INSERT OR REPLACE INTO version(version) VALUES (?)', [
        version,
    ]);
};

Database.prototype.databaseV1Setup = async function() {
    await this.queryWrapper(this.db.run, 'ALTER TABLE users ADD is_admin INTEGER DEFAULT 0');
};

Database.prototype.databaseV2Setup = async function() {
    const query =
        'ALTER TABLE tokens ADD name TEXT DEFAULT NULL;' +
        'ALTER TABLE queries ADD token TEXT REFERENCES tokens(token);';
    await this.queryWrapper(this.db.exec, query);
};

Database.prototype.close = async function() {
    const $this = this;
    return new Promise((resolve, reject) => {
        if ($this.db) {
            $this.db.close(function(err) {
                if (err) {
                    reject(err);
                } else {
                    $this.db = null;
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
};

Database.prototype.saveUser = async function(user) {
    // Only update an existing user if the user_id is specified. Technically we could also use the unique username
    // but that's likely to cause unpredictable behaviour when updating usernames.
    const dbuser = await this.getUser({ user_id: user.user_id });
    if (dbuser) {
        const updated = {
            user_id: dbuser.user_id,
            username: user.username ? user.username : dbuser.username,
            password: user.password ? user.password : dbuser.password,
            is_admin:
                user.is_admin === true || user.is_admin === false
                    ? user.is_admin
                        ? 1
                        : 0
                    : dbuser.is_admin,
        };
        await this.queryWrapper(
            this.db.run,
            'UPDATE users SET username=?,password=?,is_admin=? WHERE user_id=?',
            [updated.username, updated.password, updated.is_admin, dbuser.user_id],
        );
    } else {
        const is_admin = user.is_admin === true ? 1 : 0;
        await this.queryWrapper(
            this.db.run,
            'INSERT INTO users(username, password, is_admin) VALUES(?, ?, ?)',
            [user.username, user.password, is_admin],
        );
    }
};

Database.prototype.deleteUser = async function(user) {
    if (user.user_id) {
        await this.queryWrapper(this.db.run, 'DELETE FROM tokens WHERE user_id = ?', [
            user.user_id,
        ]);
        await this.queryWrapper(this.db.run, 'DELETE FROM user_settings WHERE user_id = ?', [
            user.user_id,
        ]);
        // This ones a little complicated. First it selects all the queries where the user_id is the current user_id.
        // It then removes any responses where the query_id matches any query_id's in the selected set.
        await this.queryWrapper(
            this.db.run,
            'DELETE FROM responses WHERE responses.query_id IN (SELECT responses.query_id FROM responses INNER JOIN queries ON queries.query_id = responses.query_id WHERE queries.user_id = ?)',
            [user.user_id],
        );
        await this.queryWrapper(this.db.run, 'DELETE FROM queries WHERE user_id = ?', [
            user.user_id,
        ]);
        await this.queryWrapper(this.db.run, 'DELETE FROM users WHERE user_id = ?', [user.user_id]);
    }
};

Database.prototype.getUser = async function(user) {
    if (user.user_id == null && user.username == null) {
        return null;
    }
    const base = 'SELECT * FROM users';
    const query = makeConditionalQuery(
        base,
        ['user_id = ?', 'username = ?', 'password = ?'],
        [user.user_id, user.username, user.password],
    );
    const dbuser = await this.queryWrapper(this.db.get, query.query, query.values);
    return dbuser;
};

Database.prototype.getUserForExport = async function(user) {
    return exportUser(await this.getUser(user));
};

Database.prototype.getUsers = async function() {
    const users = await this.queryWrapper(this.db.all, 'SELECT * FROM users ORDER BY user_id ASC');
    const parsed = [];
    users.map(user => {
        parsed.push(exportUser(user));
    });
    return parsed;
};

Database.prototype.setValue = async function(skill, user, key, value) {
    if (skill && user && key && user.user_id && value) {
        value = JSON.stringify(value);
        await this.queryWrapper(
            this.db.run,
            'INSERT OR REPLACE INTO user_settings(skill, user_id, key, value) VALUES (?, ?, ?, ?)',
            [skill, user.user_id, key, value],
        );
    } else {
        throw new Error('skill, user, key, value and user.user_id must be set');
    }
};

Database.prototype.deleteValue = async function(skill, user, key) {
    await this.queryWrapper(
        this.db.run,
        'DELETE FROM user_settings WHERE skill = ? AND user_id = ? AND key = ?',
        [skill, user.user_id, key],
    );
};

Database.prototype.getValue = async function(skill, user, key) {
    const base =
        'SELECT skill, users.username, key, value FROM user_settings INNER JOIN users ON users.user_id = user_settings.user_id';
    const user_id = user ? (user.user_id ? user.user_id : undefined) : undefined;
    const query = makeConditionalQuery(
        base,
        ['skill = ?', 'user_settings.user_id = ?', 'key = ?'],
        [skill, user_id, key],
    );
    query.query += ' ORDER BY skill ASC, user_settings.user_id ASC, key ASC';
    return await this.allQueryWrapper(query.query, query.values, key);
};

Database.prototype.setSkillValue = async function(skill, key, value) {
    if (skill && key) {
        value = JSON.stringify(value);
        await this.queryWrapper(
            this.db.run,
            'INSERT OR REPLACE INTO skill_settings(skill, key, value) VALUES (?, ?, ?)',
            [skill, key, value],
        );
    } else {
        throw new Error('skill and key must be set');
    }
};

Database.prototype.getSkillValue = async function(skill, key) {
    const base = 'SELECT skill, key, value FROM skill_settings';
    const query = makeConditionalQuery(base, ['skill = ?', 'key = ?'], [skill, key]);
    query.query += ' ORDER BY skill ASC, key ASC';
    return await this.allQueryWrapper(query.query, query.values, key);
};

Database.prototype.deleteSkillValue = async function(skill, key) {
    await this.queryWrapper(this.db.run, 'DELETE FROM skill_settings WHERE skill = ? AND key = ?', [
        skill,
        key,
    ]);
};

Database.prototype.setGlobalValue = async function(key, value) {
    if (key) {
        value = JSON.stringify(value);
        await this.queryWrapper(
            this.db.run,
            'INSERT OR REPLACE INTO global_settings(key, value) VALUES (?, ?)',
            [key, value],
        );
    } else {
        throw new Error('key must be set');
    }
};

Database.prototype.getGlobalValue = async function(key) {
    const base = 'SELECT key, value FROM global_settings';
    const query = makeConditionalQuery(base, ['key = ?'], [key]);
    query.query += ' ORDER BY key ASC';
    return await this.allQueryWrapper(query.query, query.values, key);
};

Database.prototype.deleteGlobalValue = async function(key) {
    await this.queryWrapper(this.db.run, 'DELETE FROM global_settings WHERE key = ?', [key]);
};

Database.prototype.saveToken = async function(user, token) {
    const dbtokens = await this.getUserTokens(user, token);
    if (dbtokens.length > 0) {
        await this.queryWrapper(
            this.db.run,
            'UPDATE tokens SET name=? WHERE user_id=? AND token=?',
            [token.name, user.user_id, token.token],
        );
    } else {
        await this.queryWrapper(
            this.db.run,
            'INSERT INTO tokens(token, user_id, name) VALUES(?, ?, ?)',
            [token.token, user.user_id, token.name],
        );
    }
};

Database.prototype.deleteToken = async function(token) {
    await this.queryWrapper(this.db.run, 'DELETE FROM tokens WHERE token = ?', [token.token]);
};

Database.prototype.deleteUserTokens = async function(user) {
    await this.queryWrapper(this.db.run, 'DELETE FROM tokens WHERE user_id = ?', [user.user_id]);
};

Database.prototype.getUserFromToken = async function(token) {
    if (token.token) {
        token = token.token;
    }
    const user = await this.queryWrapper(
        this.db.get,
        'SELECT users.* FROM users INNER JOIN tokens ON tokens.user_id=users.user_id WHERE tokens.token = ?',
        [token],
    );
    return exportUser(user);
};

Database.prototype.getUserTokens = async function(user, token) {
    const parsedToken = {
        token: token ? token.token : undefined,
        name: token && token.token == null ? token.name : undefined,
    };
    const base = 'SELECT token, timestamp, name FROM tokens';
    const query = makeConditionalQuery(
        base,
        ['user_id = ?', 'name = ?', 'token = ?'],
        [user.user_id, parsedToken.name, parsedToken.token],
    );
    return await this.queryWrapper(this.db.all, query.query, query.values);
};

Database.prototype.addQuery = async function(query, user, token) {
    if (token == null) {
        token = { token: null };
    }
    query = JSON.stringify(query);
    const $this = this;
    return new Promise((resolve, reject) => {
        try {
            $this.db.run(
                'INSERT INTO queries(query, user_id, token) VALUES(?, ?, ?)',
                query,
                user.user_id,
                token.token,
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ query_id: this.lastID, query, user });
                    }
                },
            );
        } catch (err) {
            reject(err);
        }
    });
};

Database.prototype.addResponse = async function(query, skill, response) {
    response = JSON.stringify(response);
    await this.queryWrapper(
        this.db.run,
        'INSERT INTO responses(query_id, skill, response) VALUES(?, ?, ?)',
        [query.query_id, skill, response],
    );
};

Database.prototype.getResponses = async function(user, skill, token, timestamp) {
    const base =
        'SELECT queries.query, responses.skill, responses.response, queries.timestamp, queries.token FROM responses INNER JOIN queries ON queries.query_id=responses.query_id';
    const query = makeConditionalQuery(
        base,
        [
            'queries.user_id = ?',
            'responses.skill = ?',
            'queries.token = ?',
            'queries.timestamp >= ?',
        ],
        [user.user_id, skill, token.token, timestamp],
    );
    const rows = await this.queryWrapper(this.db.all, query.query, query.values);
    if (rows && rows.length > 0) {
        rows.map(row => {
            row.response = JSON.parse(row.response);
            row.query = JSON.parse(row.query);
        });
    }
    return rows;
};

async function createDb(database) {
    return new Promise((resolve, reject) => {
        try {
            const local_db = new sqlite3.Database(database, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve(local_db);
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}

async function setup(database) {
    console.log(`SQLite DB: ${database}`);
    const sqlite_db = await createDb(database);
    const db = new Database(sqlite_db);
    await db.queryWrapper(db.db.exec, setupQuery);
    const version = await db.getVersion();
    switch (version) {
        case 0:
            await db.databaseV1Setup();
            await db.setVersion(1);
        // Fallthrough.
        case 1:
            await db.databaseV2Setup();
            await db.setVersion(2);
        // Fallthrough.
        default:
            break;
    }
    return db;
}

module.exports = {
    setup,
};
