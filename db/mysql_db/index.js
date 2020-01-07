const fs = require('fs');
const mysql = require('mysql');

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

function mapKey(results) {
    if (results) {
        if (Array.isArray(results)) {
            for (let i = 0; i < results.length; i++) {
                results[i].key = results[i].name;
                results[i].name = undefined;
            }
        } else {
            results.key = results.name;
            results.name = undefined;
        }
    }
}

function Database() {
    this.db = null;
}

Database.prototype.loadDefaultSql = async function() {
    return new Promise((resolve, reject) => {
        fs.readFile('./db/mysql_db/database.sql', 'utf8', function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

Database.prototype.query = async function(query, values, multiple) {
    return new Promise((resolve, reject) => {
        try {
            this.db.query(query, values, function(error, results) {
                if (error) {
                    reject(
                        new Error(
                            `Error running query: ${query} - ${JSON.stringify(values)}: ${error}`,
                        ),
                    );
                } else {
                    if (Array.isArray(results)) {
                        if (!multiple) {
                            if (results.length == 0) {
                                resolve(null);
                            } else if (results.length == 1) {
                                resolve(results[0]);
                            } else {
                                reject(`Singular query returned multiple results. query:${query}`);
                            }
                        } else {
                            resolve(results);
                        }
                    } else {
                        resolve(results);
                    }
                }
            });
        } catch (err) {
            reject(err);
        }
    });
};

Database.prototype.allQueryWrapper = async function(query, values, key) {
    const rows = await this.query(query, values, true);
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
    const row = await this.query('SELECT * FROM version ORDER BY version DESC LIMIT 1');
    return row.version;
};

Database.prototype.setVersion = async function(version) {
    await this.query('REPLACE INTO version(version) VALUES (?)', [version]);
};

Database.prototype.close = async function() {
    return new Promise(resolve => {
        this.db.end();
        resolve();
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
        await this.query('UPDATE users SET username=?,password=?,is_admin=? WHERE user_id=?', [
            updated.username,
            updated.password,
            updated.is_admin,
            dbuser.user_id,
        ]);
    } else {
        const is_admin = user.is_admin === true ? 1 : 0;
        await this.query('INSERT INTO users(username, password, is_admin) VALUES(?, ?, ?)', [
            user.username,
            user.password,
            is_admin,
        ]);
    }
};

Database.prototype.deleteUser = async function(user) {
    if (user.user_id) {
        await this.query('DELETE FROM tokens WHERE user_id = ?', [user.user_id]);
        await this.query('DELETE FROM user_settings WHERE user_id = ?', [user.user_id]);
        // This ones a little complicated. First it selects all the queries where the user_id is the current user_id.
        // It then removes any responses where the query_id matches any query_id's in the selected set.
        await this.query(
            'DELETE FROM responses WHERE responses.query_id IN (SELECT responses.query_id FROM responses INNER JOIN queries ON queries.query_id = responses.query_id WHERE queries.user_id = ?)',
            [user.user_id],
        );
        await this.query('DELETE FROM queries WHERE user_id = ?', [user.user_id]);
        await this.query('DELETE FROM users WHERE user_id = ?', [user.user_id]);
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
    const dbuser = await this.query(query.query, query.values);
    return dbuser;
};

Database.prototype.getUserForExport = async function(user) {
    return exportUser(await this.getUser(user));
};

Database.prototype.getUsers = async function() {
    const users = await this.query('SELECT * FROM users ORDER BY user_id ASC', [], true);
    const parsed = [];
    users.map(user => {
        parsed.push(exportUser(user));
    });
    return parsed;
};

Database.prototype.setValue = async function(skill, user, key, value) {
    if (skill && user && key && user.user_id) {
        value = JSON.stringify(value);
        await this.query(
            'REPLACE INTO user_settings(skill, user_id, name, value) VALUES (?, ?, ?, ?)',
            [skill, user.user_id, key, value],
        );
    } else {
        throw new Error('skill, user and key must be set');
    }
};

Database.prototype.deleteValue = async function(skill, user, key) {
    await this.query('DELETE FROM user_settings WHERE skill = ? AND user_id = ? AND name = ?', [
        skill,
        user.user_id,
        key,
    ]);
};

Database.prototype.getValue = async function(skill, user, key) {
    const base =
        'SELECT skill, users.username, name, value FROM user_settings INNER JOIN users ON users.user_id = user_settings.user_id';
    let user_id = user ? (user.user_id ? user.user_id : undefined) : undefined;
    const query = makeConditionalQuery(
        base,
        ['skill = ?', 'user_settings.user_id = ?', 'name = ?'],
        [skill, user_id, key],
    );
    query.query += ' ORDER BY skill ASC, user_settings.user_id ASC, name ASC';
    const results = await this.allQueryWrapper(query.query, query.values, key);
    mapKey(results);
    return results;
};

Database.prototype.setSkillValue = async function(skill, key, value) {
    if (skill && key) {
        value = JSON.stringify(value);
        await this.query('REPLACE INTO skill_settings(skill, name, value) VALUES (?, ?, ?)', [
            skill,
            key,
            value,
        ]);
    } else {
        throw new Error('skill and key must be set');
    }
};

Database.prototype.getSkillValue = async function(skill, key) {
    const base = 'SELECT skill, name, value FROM skill_settings';
    const query = makeConditionalQuery(base, ['skill = ?', 'name = ?'], [skill, key]);
    query.query += ' ORDER BY skill ASC, name ASC';
    const results = await this.allQueryWrapper(query.query, query.values, key);
    mapKey(results);
    return results;
};

Database.prototype.deleteSkillValue = async function(skill, key) {
    await this.query('DELETE FROM skill_settings WHERE skill = ? AND name = ?', [skill, key]);
};

Database.prototype.setGlobalValue = async function(key, value) {
    if (key) {
        value = JSON.stringify(value);
        await this.query('REPLACE INTO global_settings(name, value) VALUES (?, ?)', [key, value]);
    } else {
        throw new Error('key must be set');
    }
};

Database.prototype.getGlobalValue = async function(key) {
    const base = 'SELECT name, value FROM global_settings';
    const query = makeConditionalQuery(base, ['name = ?'], [key]);
    query.query += ' ORDER BY name ASC';
    const results = await this.allQueryWrapper(query.query, query.values, key);
    mapKey(results);
    return results;
};

Database.prototype.deleteGlobalValue = async function(key) {
    await this.query('DELETE FROM global_settings WHERE name = ?', [key]);
};

Database.prototype.saveToken = async function(user, token) {
    const dbtokens = await this.getUserTokens(user, token);
    if (dbtokens.length > 0) {
        await this.query('UPDATE tokens SET name=? WHERE user_id=? AND token=?', [
            token.name,
            user.user_id,
            token.token,
        ]);
    } else {
        await this.query('INSERT INTO tokens(token, user_id, name) VALUES(?, ?, ?)', [
            token.token,
            user.user_id,
            token.name,
        ]);
    }
};

Database.prototype.deleteToken = async function(token) {
    await this.query('DELETE FROM tokens WHERE token = ?', [token.token]);
};

Database.prototype.deleteUserTokens = async function(user) {
    await this.query('DELETE FROM tokens WHERE user_id = ?', [user.user_id]);
};

Database.prototype.getUserFromToken = async function(token) {
    if (token.token) {
        token = token.token;
    }
    const user = await this.query(
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
    return await this.query(query.query, query.values, true);
};

Database.prototype.addQuery = async function(query, user, token) {
    if (token == null) {
        token = { token: null };
    }
    query = JSON.stringify(query);
    const results = await this.query('INSERT INTO queries(query, user_id, token) VALUES(?, ?, ?)', [
        query,
        user.user_id,
        token.token,
    ]);
    return { query_id: results.insertId, query, user };
};

Database.prototype.addResponse = async function(query, skill, response) {
    response = JSON.stringify(response);
    await this.query('INSERT INTO responses(query_id, skill, response) VALUES(?, ?, ?)', [
        query.query_id,
        skill,
        response,
    ]);
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
    const rows = await this.query(query.query, query.values, true);
    if (rows && rows.length > 0) {
        rows.map(row => {
            row.response = JSON.parse(row.response);
            row.query = JSON.parse(row.query);
        });
    }
    return rows;
};

function connect(options, callback) {
    const local_db = mysql.createConnection({
        ...options,
        multipleStatements: true,
        charset: 'utf8mb4_general_ci',
    });

    local_db.on('error', function(err) {
        console.log('MySQL DB Error', err);
        if (err.code == 'PROTOCOL_CONNECTION_LOST') {
            connect();
        }
    });

    local_db.connect(function(err) {
        if (err) {
            console.log('Failed to connect to MySQL server, retrying in 10 seconds.');
            setTimeout(function() {
                connect(options, callback);
            }, 10000);
        } else {
            console.log('Connected to MySQL server.');
            callback(local_db);
        }
    });
}

Database.prototype.connect = async function(host, username, password, database) {
    this.db = await new Promise((resolve, reject) => {
        try {
            connect(
                {
                    host: host,
                    user: username,
                    password: password,
                    database: database,
                },
                resolve,
            );
        } catch (err) {
            reject(err);
        }
    });
};

async function setup(host, username, password, database) {
    const db = new Database();
    await db.connect(host, username, password, database);
    console.log('MySQL database connected.');
    const setupQuery = await db.loadDefaultSql();
    await db.query(setupQuery, [], true);
    const version = await db.getVersion();
    switch (version) {
        default:
            break;
    }

    return db;
}

module.exports = {
    setup,
};
