const wrap = require('co-express')
const router = require('express').Router()

router.get('/', wrap(function *(req, res) {
    // If the user is an admin, return all users. If they're not, only return them.
    if (req.user.is_admin) {
        const users = yield global.db.getUsers()
        res.json(users)
    } else {
        res.json([req.user])
    }
}))

router.get('/:user/:delete?', wrap(function *(req, res) {
    if (req.user.is_admin || req.params.user == req.user.username) {
        const target_user = yield global.db.getUser({username: req.params.user})
        if (target_user) {
            if (req.params.delete) {
                // This branch is for deleting an existing user.
                yield global.db.deleteUser(target_user)
                res.json({text: 'User deleted.'})
            } else {
                // This branch is for updating or fetching an existing user.
                if (req.query.username || req.query.password || req.query.is_admin) {
                    if (req.query.username) {
                        target_user.username = req.query.username
                    }
                    if (req.query.password) {
                        target_user.password = yield global.auth.encryptPassword(req.query.password)
                    }
                    if (req.user.is_admin && req.query.is_admin !== undefined && req.query.is_admin !== null) {
                        target_user.is_admin = req.query.is_admin === true || req.query.is_admin == 'true'
                    }
                    console.log("Updating user.")
                    try {
                        console.log(target_user)
                        yield global.db.saveUser(target_user);
                        res.json(yield global.db.getUser({username: target_user.username}))
                    } catch (err) {
                        res.status(503).json({error: `Failed to add user ${JSON.stringify(err)}`})
                    }
                } else {
                    res.json(target_user)
                }
            }
        } else {
            // This branch is for creating a new user.
            if (req.user.is_admin && req.query.password && req.query.is_admin) {
                console.log("Adding new user");
                const target_user = {
                    username: req.params.user,
                    password: yield global.auth.encryptPassword(req.query.password),
                    is_admin: req.query.is_admin === true || req.query.is_admin == 'true'
                }
                try {
                    console.log(target_user)
                    yield global.db.saveUser(target_user);
                    res.json(yield global.db.getUser({username: target_user.username}))
                } catch (err) {
                    res.status(503).json({error: `Failed to add user ${JSON.stringify(err)}`})
                }
            } else {
                res.status(404).json({error: 'Not enough parameters supplied or you\'re not an admin.'})
            }
        }
    } else {
        res.sendStatus(401).json({error: 'Forbidden.'})
    }
}))

module.exports = router
