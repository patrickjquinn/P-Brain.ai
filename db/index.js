let Config = null
try {
    Config = require('./config.json')
} catch (err) {
    console.log('Using default SQLite database provider')
    Config = require('./sqlite_db/config.json')
}

if (Config.databaseType == 'sqlite') {
    module.exports = {
        setup: function * () {
            const Database = require('./sqlite_db')
            return yield Database.setup(Config.databaseArguments.file)
        }
    }
} else if (Config.databaseType == 'mysql') {
    module.exports = {
        setup: function * () {
            const Database = require('./mysql_db')
            return yield Database.setup(Config.databaseArguments.host,
                                        Config.databaseArguments.username,
                                        Config.databaseArguments.password,
                                        Config.databaseArguments.database)
        }
    }
}
