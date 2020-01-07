function hardRule(query) {
    return query.startsWith('your name') || query.startsWith('youre called');
}

const DEFAULT_NAME = 'Brain';

async function getName(user) {
    try {
        const nametmp = await global.db.getValue('name', user, 'name');
        if (nametmp) {
            return nametmp;
        }
    } catch (err) {
        // Ignore and use the default name.
    }
    return DEFAULT_NAME;
}

async function name_resp(query, breakdown, user) {
    query = query.toLowerCase();
    let name = await getName(user);
    if (query.includes('who') || query.includes('what')) {
        if (query.toLowerCase().includes('what') && query.toLowerCase().includes('are')) {
            return { text: `I'm called ${name}, your Brain.`, name };
        }
        return { text: `I'm called ${name}.`, name };
    }
    const words = query.split(' ');
    name = words[words.length - 1];
    name = name.charAt(0).toUpperCase() + name.slice(1);

    await global.db.setValue('name', user, 'name', name);

    global.sendToUser(user, 'set_name', { name });

    return { text: `You can now call me ${name}.`, name };
}

async function registerClient(socket, user) {
    socket.on('get_name', () => {
        (async function() {
            const name = await getName(user);
            socket.emit('get_name', { name });
        })().catch(err => {
            console.warn(err);
        });
    });
    const name = await getName(user);
    socket.emit('set_name', { name });
}

const examples = () => ['Your name is Dave.'];

module.exports = {
    get: name_resp,
    registerClient,
    hardRule,
    examples,
};
