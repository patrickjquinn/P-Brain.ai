const wrap = require('./wrap');
const router = require('express').Router();

router.get(
    '/global_setting/:key?',
    wrap(async function(req, res) {
        const user = req.user;
        if (user.is_admin) {
            if (req.params.key && req.query.value) {
                const value = JSON.parse(req.query.value);
                await global.db.setGlobalValue(req.params.key, value);
                res.json(value);
            } else if (req.params.key && req.query.delete != undefined) {
                await global.db.deleteGlobalValue(req.params.key);
                res.json({ text: 'Successfully deleted.' });
            } else {
                res.json(await global.db.getGlobalValue(req.params.key));
            }
        } else {
            res.sendStatus(401);
        }
    }),
);

router.get(
    '/skill_setting/:skill?/:name?',
    wrap(async function(req, res) {
        const user = req.user;
        if (user.is_admin) {
            if (req.params.skill && req.params.name && req.query.value) {
                const value = JSON.parse(req.query.value);
                await global.db.setSkillValue(req.params.skill, req.params.name, value);
                res.json(value);
            } else if (req.params.skill && req.params.name && req.query.delete != undefined) {
                await global.db.deleteSkillValue(req.params.skill, req.params.name);
                res.json({ text: 'Successfully deleted.' });
            } else {
                res.json(await global.db.getSkillValue(req.params.skill, req.params.name));
            }
        } else {
            res.sendStatus(401);
        }
    }),
);

router.get(
    '/user_setting/:user?/:skill?/:name?',
    wrap(async function(req, res) {
        let user = req.user;
        if (req.params.user) {
            if (user.is_admin || req.params.user == user.username) {
                user = await global.db.getUser({ username: req.params.user });
                if (user) {
                    if (req.params.user && req.params.skill && req.params.name && req.query.value) {
                        const value = JSON.parse(req.query.value);
                        await global.db.setValue(req.params.skill, user, req.params.name, value);
                        return res.json(value);
                    } else if (
                        req.params.user &&
                        req.params.skill &&
                        req.params.name &&
                        req.query.delete != undefined
                    ) {
                        await global.db.deleteValue(req.params.skill, user, req.params.name);
                        res.json({ text: 'Successfully deleted.' });
                    }
                } else {
                    return res.status(404).json({ error: 'User not found.' });
                }
            } else {
                return res.sendStatus(401);
            }
        }
        if (user) {
            return res.json(await global.db.getValue(req.params.skill, user, req.params.name));
        } else {
            return res.status(404).json({ error: 'User not found.' });
        }
    }),
);

module.exports = router;
