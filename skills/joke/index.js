const request = require('../../api/request');

const intent = () => ({
    keywords: ['tell me a joke', 'say something funny', 'make me laugh'],
    module: 'joke',
});

async function joke_resp() {
    const joke_url = 'https://api.chucknorris.io/jokes/random';

    let data = await request(joke_url);

    data = JSON.parse(data.body);

    return { text: data.value };
}

const examples = () => ['Tell a joke.', 'Make me laugh.', 'Say something funny.'];

module.exports = {
    get: joke_resp,
    intent,
    examples,
};
