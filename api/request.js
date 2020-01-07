const fetch = require('node-fetch');

async function request(options) {
    if (typeof options === 'string') {
        options = {
            uri: options,
        };
    }

    const result = await fetch(options.uri || options.url, {
        ...(options.headers ? options.headers : {}),
    });
    const text = await result.text();
    if (!result.ok) {
        throw new Error(text);
    }
    return {
        body: text,
    };
}

module.exports = request;
