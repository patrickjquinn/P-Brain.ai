const wrap = require('co-express')
const router = require('express').Router()

router.get('/', wrap(function *(req, res) {
    const user = req.user
    if (user.is_admin) {
        const users = yield global.db.getUsers()
        res.json(users)
    } else {
        res.sendStatus(401)
    }
}))

module.exports = router