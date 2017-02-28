const wrap = require('co-express')
const router = require('express').Router()

router.get('/global_setting/:key?', wrap(function *(req, res) {
    const user = req.user
    if (user.is_admin) {
        if (req.params.key && req.query.value) {
            const value = JSON.parse(req.query.value)
            yield global.db.setGlobalValue(req.params.key, value)
            res.json(value)
        } else {
            res.json(yield global.db.getGlobalValue(req.params.key))
        }
    } else {
        res.sendStatus(401)
    }
}))

router.get('/skill_setting/:skill?/:name?', wrap(function *(req, res) {
    const user = req.user
    if (user.is_admin) {
        if (req.params.skill && req.params.name && req.query.value) {
            const value = JSON.parse(req.query.value)
            yield global.db.setSkillValue(req.params.skill, req.params.name, value)
            res.json(value)
        } else {
            res.json(yield global.db.getSkillValue(req.params.skill, req.params.name))
        }
    } else {
        res.sendStatus(401)
    }
}))

router.get('/user_setting/:user?/:skill?/:name?', wrap(function *(req, res) {
    let user = req.user
    if (req.params.user) {
        if (user.is_admin || req.params.user == user.username) {
            user = yield global.db.getUserFromName(req.params.user)
            if (req.params.user && req.params.skill && req.params.name && req.query.value) {
                const value = JSON.parse(req.query.value)
                yield global.db.setValue(req.params.skill, user, req.params.name, value)
                return res.json(value)
            }
        } else {
            return res.sendStatus(401)
        }
    }
    return res.json(yield global.db.getValue(req.params.skill, user, req.params.name))
}))

module.exports = router
