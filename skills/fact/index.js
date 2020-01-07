const google = require('./google');
const duckduckgo = require('./duckduckgo');
// TODO, This needs updating wolfram-alpha lib is out of date
//const wolframalpha = require('./wolframalpha')

const not_found_responses = [
    'Hmmm I dont seem to know ',
    "Sorry I couldn't understand ",
    'My memory banks dont contain ',
];
const resp_functs = [google, duckduckgo /*, wolframalpha*/];

const intent = () => ({
    keywords: [
        'what qqqq',
        'who won qqqq',
        'who is qqqq',
        'where is qqqq',
        'when did qqqq',
        'what is qqqq',
        'what is qqqq in qqqq',
        'whats qqqq',
        '√ ',
        '-',
        '+',
        '%',
        '/',
        '*',
    ],
    module: 'fact',
});

async function setup() {
    for (const funct of resp_functs) {
        if (funct.setup) {
            await Promise.resolve(funct.setup());
        }
    }
}

async function fact_resp(query) {
    let fact = null;

    for (let i = 0; i < resp_functs.length; i++) {
        const response = await resp_functs[i].get(query);

        if (response && response !== '') {
            fact = response;
            break;
        }
    }

    if (!fact) {
        return {
            text:
                not_found_responses[Math.floor(Math.random() * not_found_responses.length)] + query,
        };
    }

    if (fact.includes('|') && fact.includes('name') && fact.includes('location')) {
        let tokenized_fact = fact.split('|');
        fact = 'You are in ' + tokenized_fact[tokenized_fact.length - 1].trim();
    }

    return { text: fact };
}

const examples = () => [
    'What color is the sky?',
    'When is season 7 of Game Of Thrones?',
    'Where is Paris?',
    'What is 200 Pounds in Euro?',
    "What's 2+2?",
    'What is 3/4',
    'what is two plus two',
];

module.exports = {
    get: fact_resp,
    intent,
    examples,
    setup,
};
