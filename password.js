global.db = require('./sqlite_db');
const auth = require('./authentication');
const co = require('co');
if (process.argv.length < 4) {
    console.log('Adds a user to the database or updates the password if they exist.');
    console.log('Usage: password.js <username> <password> <is_admin(true/false)>');
} else {
    co(function*() {
        console.log('Setting up database.');
        yield global.db.setup('pbrain.db');
        let is_admin = 0;
        if (process.argv[4]) {
            is_admin = process.argv[4] == 'true';
        }
        const user = {
            username: process.argv[2],
            password: yield auth.encryptPassword(process.argv[3]),
            is_admin: is_admin,
        };
        console.log(user);
        yield global.db.saveUser(user);
        console.log('User saved');
    }).catch(err => {
        console.log(err);
        throw err;
    });
}
