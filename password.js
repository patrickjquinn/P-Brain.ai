const md5 = require('md5')
const config = require('./config').get
if (process.argv.length != 3) {
    console.log("Usage: password.js <password>")
} else {
    console.log(md5(process.argv[2] + config.auth.static_salt).toUpperCase())
}
