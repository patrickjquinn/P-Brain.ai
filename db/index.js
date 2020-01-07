const DB_FILE = process.env['DB_FILE'];
const DEFAULT_DB = 'pbrain.db';

let Config = null;
try {
    Config = require('./config.json');
} catch (err) {
    console.log('Using default SQLite database provider');
    try {
        Config = require('./sqlite_db/config.json');
        console.log('SQLite3 Config Loaded');
    } catch (err) {
        console.warn('Could not load SQLite3 Config');
        Config = {
            databaseArguments: {
                file: DEFAULT_DB,
            },
            databaseType: 'sqlite',
        };
    }

    if (DB_FILE) {
        Config.databaseArguments.file = DB_FILE;
    }
}

if (Config.databaseType == 'sqlite') {
    module.exports = {
        setup: async function(args) {
            if (args && args.file) {
                Config.databaseArguments.file = args.file;
            }
            const Database = require('./sqlite_db');
            return await Database.setup(Config.databaseArguments.file);
        },
    };
} else if (Config.databaseType == 'mysql') {
    module.exports = {
        setup: async function() {
            const Database = require('./mysql_db');
            return await Database.setup(
                Config.databaseArguments.host,
                Config.databaseArguments.username,
                Config.databaseArguments.password,
                Config.databaseArguments.database,
            );
        },
    };
}
