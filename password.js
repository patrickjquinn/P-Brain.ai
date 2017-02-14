global.db = require('./sqlite_db')
const auth = require('./authentication')
const co = require('co')
if (process.argv.length != 4) {
    console.log("Usage: password.js <username> <password>")
} else {
    co(function * () {
        console.log("Setting up database.")
        yield global.db.setup('pbrain.db')
        const user = {
          username: process.argv[2],
          password: yield auth.encryptPassword(process.argv[3])
        }
        console.log(user)
        yield global.db.saveUser(user)
        console.log("User saved")
    }).catch(err => {
        console.log(err)
        throw err
    })
}

