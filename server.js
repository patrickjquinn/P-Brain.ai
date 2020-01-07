const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, { pingInterval: 2000, pingTimeout: 7000 });
const wrap = require('./api/wrap');
const compression = require('compression');
const search = require('./api/core-ask.js');
const skills = require('./skills/skills.js');
const settingsApi = require('./api/settings.js');
const usersApi = require('./api/users.js');
const cookieParser = require('cookie-parser');
global.auth = require('./authentication');
const Database = require('./db');

app.use(
    compression({
        threshold: 0,
        level: 9,
        memLevel: 9,
    }),
);

app.use((req, res, next) => {
    req.connection.setNoDelay(true);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
});

app.use(cookieParser());

app.get(
    '/api/status',
    wrap(async function(req, res) {
        res.json({ status: 200, msg: 'OK' });
    }),
);

app.use('/', [global.auth.filter(true), express.static('./src')]);
app.use('/api/settings', [global.auth.filter(false), settingsApi]);
app.use('/api/users', [global.auth.filter(false), usersApi]);
app.get(
    '/api/user',
    global.auth.filter(false),
    wrap(async function(req, res) {
        res.json(req.user);
    }),
);
app.get(
    '/api/token',
    global.auth.filter(false),
    wrap(async function(req, res) {
        res.json(req.token);
    }),
);

app.get(
    '/api/status',
    global.auth.filter(false),
    wrap(async function(req, res) {
        res.json({ status: 200, msg: 'OK' });
    }),
);

// TODO parse services in query
app.get(
    '/api/ask',
    global.auth.filter(false),
    wrap(async function(req, res) {
        const input = req.query.q.toLowerCase();

        try {
            const result = await search.query(input, req.user, req.token);
            res.json(result);
        } catch (e) {
            console.log(e);
            res.json({ msg: { text: "Sorry, I didn't understand " + input }, type: 'error' });
        }
    }),
);

app.get('/api/login', global.auth.login);
app.get('/api/logout/:user?', [global.auth.filter(false), global.auth.logout]);
app.get('/api/tokens/:user?', [global.auth.filter(false), global.auth.viewTokens]);
app.get('/api/validate', [global.auth.filter(false), global.auth.validate]);
io.use(global.auth.verifyIO);

io.on('connect', socket => {
    socket.on('ask', function(msg) {
        search
            .query(msg, socket.user, socket.token)
            .then(result => {
                socket.emit('response', result);
            })
            .catch(err => {
                console.log(err);
                socket.emit('response', {
                    msg: { text: "Sorry, I didn't understand " + msg.text.toLowerCase() },
                    type: 'error',
                });
            });
    });
    skills.registerClient(socket, socket.user).catch(err => {
        console.warn('Failed to register client', err);
    });
});

async function initialSetup() {
    if ((await global.db.getGlobalValue('port')) == null) {
        console.log('Setting default global values in database');
        await global.db.setGlobalValue('port', 4567);
        await global.db.setGlobalValue('promiscuous_mode', true);
        await global.db.setGlobalValue('promiscuous_admins', true);
    }
}

async function main() {
    console.log('Setting up database.');
    global.db = await Database.setup();
    await initialSetup();

    global.sendToUser = function(user, type, message) {
        const sockets = global.auth.getSocketsByUser(user);
        sockets.map(socket => {
            socket.emit(type, message);
        });
    };
    global.sendToDevice = function(token, type, message) {
        const socket = global.auth.getSocketByToken(token);
        if (socket) {
            socket.emit(type, message);
        } else {
            console.log('Failed to send to device: ' + JSON.stringify(token));
        }
    };

    console.log('Loading skills.');
    await skills.loadSkills();
    console.log('Training recognizer.');
    await search.train_recognizer(skills.getSkills());
    console.log('Starting server.');
    const port = await global.db.getGlobalValue('port');
    http.listen(port, () => {
        console.log(`Server started on http://localhost:${port}`);
    });

    const promiscuous = await global.db.getGlobalValue('promiscuous_mode');
    const promiscuous_admins = await global.db.getGlobalValue('promiscuous_admins');
    if (promiscuous) {
        console.log('Warning! Promiscuous mode is enabled all logins will succeed.');
        if (promiscuous_admins) {
            console.log(
                'Possibly deadly warning! Promiscuous admins is enabled.' +
                    ' All new users will be admins and can view each others data.',
            );
        }
        console.log(`Settings can be changed at http://localhost:${port}/settings.html`);
    }
}

main().catch(err => {
    console.log(err);
    process.exit(1);
});
