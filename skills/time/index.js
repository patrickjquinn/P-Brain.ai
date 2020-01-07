const intent = () => ({
    keywords: ['what time is it', 'what is the time'],
    module: 'time',
});

async function time_resp() {
    const time = new Date().toLocaleTimeString('en-GB', {
        hour: 'numeric',
        minute: 'numeric',
    });

    return { text: 'It is ' + time };
}

const examples = () => ['What time is it?', "What's the current time?", 'Tell me the time.'];

module.exports = {
    get: time_resp,
    intent,
    examples,
};
